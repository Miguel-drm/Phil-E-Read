import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import connectDB from './utils/db';
import { mongoStoryService } from './services/mongoStoryService';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initGridFSBucket } from './config/gridfsConfig';
import mongoose from 'mongoose';
import Story from './models/Story';

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
    // Connect to MongoDB first
    const db = await connectDB();
    console.log('Connected to MongoDB');

    // Initialize GridFS
    await initGridFSBucket();
    console.log('GridFS initialized');

    // Start the server only after successful database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle database disconnection
    db.on('disconnected', () => {
      console.error('Lost MongoDB connection. Please check your database connection.');
    });

    db.on('error', (error) => {
      console.error('MongoDB error:', error);
    });

    // Story Routes
    app.get('/api/stories', async (req: Request, res: Response) => {
      try {
        const { readingLevel, categories, language, title } = req.query;
        console.log('Query params:', { readingLevel, categories, language, title });
        
        const filters = {
          ...(readingLevel && { readingLevel: String(readingLevel) }),
          ...(categories && { categories: Array.isArray(categories) ? categories.map(String) : [String(categories)] }),
          ...(language && { language: String(language) }),
          ...(title && { title: String(title) })
        };
        console.log('Applying filters:', filters);
        
        const stories = await mongoStoryService.getStories(filters);
        console.log('Stories found:', stories.length);
        res.json(stories);
      } catch (error) {
        console.error('Detailed error in /api/stories:', error);
        res.status(500).json({ 
          error: 'Failed to fetch stories',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
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
        console.log('PDF endpoint called for story ID:', req.params.id);
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          console.error('Invalid story ID format:', req.params.id);
          res.status(400).json({ error: 'Invalid story ID format' });
          return;
        }

        const story = await Story.findById(req.params.id);
        console.log('Story found:', {
          id: story?._id,
          title: story?.title,
          hasPdfFileId: !!story?.pdfFileId,
          hasPdfData: !!story?.pdfData,
          pdfDataLength: story?.pdfData?.length
        });

        if (!story) {
          console.error('Story not found:', req.params.id);
          res.status(404).json({ error: 'Story not found' });
          return;
        }

        console.log('Attempting to get PDF content...');
        const pdfBuffer = await mongoStoryService.getPDFContent(req.params.id);
        
        console.log('PDF content retrieved successfully, size:', pdfBuffer.length);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', 'inline; filename="story.pdf"');
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Detailed error serving PDF:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        res.status(500).json({ 
          error: 'Failed to serve PDF',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.post('/api/stories', upload.single('pdf'), async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'PDF file is required' });
          return;
        }

        const { title, description, language, createdBy, readingLevel, categories } = req.body;
        
        // Log received data for debugging
        console.log('Received story data:', {
          title,
          description,
          language,
          createdBy,
          readingLevel,
          categories,
          fileSize: req.file.size,
          fileName: req.file.originalname
        });

        // Validate required fields
        const missingFields = [];
        if (!title) missingFields.push('title');
        if (!description) missingFields.push('description');

        if (missingFields.length > 0) {
          res.status(400).json({ 
            error: 'Missing required fields', 
            missingFields,
            receivedData: req.body 
          });
          return;
        }

        // Parse categories if it's a string
        let parsedCategories;
        try {
          parsedCategories = categories ? JSON.parse(categories) : undefined;
        } catch (error) {
          console.warn('Failed to parse categories:', error);
          parsedCategories = undefined;
        }

        const storyData = {
          title: title.trim(),
          description: description.trim(),
          language: language || 'english',
          createdBy,
          readingLevel,
          categories: parsedCategories,
          textContent: ''  // Default empty string for text content
        };

        console.log('Creating story with data:', storyData);

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

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();