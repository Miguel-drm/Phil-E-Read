import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import connectDB from './utils/db';
import { mongoStoryService } from './services/mongoStoryService';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initGridFSBucket } from './config/gridfsConfig';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// No need to configure worker in Node.js environment as we're using the legacy build
// which doesn't require a worker

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB and start server
(async () => {
  try {
    await connectDB();
    initGridFSBucket();
    console.log('Connected to MongoDB');
    
    // Story Routes
    app.get('/api/stories', async (req: Request, res: Response) => {
      try {
        const { readingLevel, categories, language, title } = req.query;
        const filters = {
          ...(readingLevel && { readingLevel: String(readingLevel) }),
          ...(categories && { categories: Array.isArray(categories) ? categories.map(String) : [String(categories)] }),
          ...(language && { language: String(language) }),
          ...(title && { title: String(title) }),
        };
        const stories = await mongoStoryService.getStories(filters);
        res.json(stories);
      } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ error: 'Failed to fetch stories' });
      }
    });

    app.get('/api/stories/:id', async (req: Request, res: Response) => {
      try {
        const story = await mongoStoryService.getStoryById(req.params.id);
        if (!story) {
          res.status(404).json({ error: 'Story not found' });
          return;
        }
        res.json(story);
      } catch (error) {
        console.error('Error fetching story:', error);
        res.status(500).json({ error: 'Failed to fetch story' });
      }
    });

    app.get('/api/stories/:id/pdf', async (req: Request, res: Response) => {
      try {
        const pdfBuffer = await mongoStoryService.getPDFContent(req.params.id);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', 'inline; filename="story.pdf"');
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(500).json({ error: 'Failed to serve PDF' });
      }
    });

    app.post('/api/stories', upload.single('pdf'), async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'PDF file is required' });
          return;
        }

        const { title, description, grade, language, createdBy, readingLevel, categories } = req.body;
        
        if (!title || !description || !grade) {
          res.status(400).json({ error: 'Title, description, and grade are required' });
          return;
        }

        // Extract text from PDF
        let textContent = '';
        try {
          // Create a clean ArrayBuffer from the file buffer
          const arrayBuffer = req.file.buffer.buffer.slice(
            req.file.buffer.byteOffset,
            req.file.buffer.byteOffset + req.file.buffer.byteLength
          );
          
          console.log('Starting PDF text extraction...');
          const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
          const pdf = await loadingTask.promise;
          
          console.log(`PDF loaded successfully. Processing ${pdf.numPages} pages...`);
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            console.log(`Extracting text from page ${pageNum}...`);
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item: any) => item.str)
              .join(' ')
              .trim();
            
            if (pageText) {
              textContent += pageText + '\n\n';
            }
          }
          
          if (!textContent.trim()) {
            throw new Error('No text content could be extracted from the PDF');
          }
          
          console.log(`Text extraction completed. Extracted ${textContent.length} characters`);
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
          res.status(400).json({ 
            error: 'Failed to extract text from PDF. Please ensure the PDF contains readable text content.',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
          return;
        }

        const storyData = {
          title,
          description,
          grade,
          language,
          createdBy,
          readingLevel,
          categories: categories ? JSON.parse(categories) : undefined,
          textContent: textContent.trim()
        };

        const story = await mongoStoryService.createStory(storyData, req.file.buffer);
        res.status(201).json(story);
      } catch (error) {
        console.error('Error creating story:', error);
        res.status(400).json({ 
          error: 'Failed to create story',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.put('/api/stories/:id', upload.single('pdf'), async (req: Request, res: Response) => {
      try {
        const updateData = {
          ...req.body,
          ...(req.file && { pdfData: req.file.buffer })
        };
        const story = await mongoStoryService.updateStory(req.params.id, updateData);
        if (!story) {
          res.status(404).json({ error: 'Story not found' });
          return;
        }
        res.json(story);
      } catch (error) {
        console.error('Error updating story:', error);
        res.status(400).json({ error: 'Failed to update story' });
      }
    });

    app.delete('/api/stories/:id', async (req: Request, res: Response) => {
      try {
        const story = await mongoStoryService.deleteStory(req.params.id);
        if (!story) {
          res.status(404).json({ error: 'Story not found' });
          return;
        }
        res.json({ message: 'Story deleted successfully' });
      } catch (error) {
        console.error('Error deleting story:', error);
        res.status(400).json({ error: 'Failed to delete story' });
      }
    });

    app.get('/api/stories/search', async (req: Request, res: Response) => {
      try {
        const { q } = req.query;
        if (!q) {
          res.status(400).json({ error: 'Search term is required' });
          return;
        }
        const stories = await mongoStoryService.searchStories(String(q));
        res.json(stories);
      } catch (error) {
        console.error('Error searching stories:', error);
        res.status(500).json({ error: 'Failed to search stories' });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();