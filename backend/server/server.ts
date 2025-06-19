import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import connectDB from './utils/db.js';
import { mongoStoryService } from './services/mongoStoryService.js';
import { initGridFSBucket } from './config/gridfsConfig.js';
import mongoose from 'mongoose';
import Story, { IStory } from './models/Story.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === 'production';

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
app.use(cors({
  origin: isProduction
    ? 'https://phil-e-read-7p2c.onrender.com'
    : 'http://localhost:5000', // or whatever your local frontend port is
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// // Serve static files from the frontend's dist directory
// const frontendDistPath = join(__dirname, '..', '..', 'frontend', 'dist');
// console.log('Serving static files from:', frontendDistPath);
// app.use(express.static(frontendDistPath));

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

        // Use lean() to get plain JavaScript object
        const story = await Story.findById(req.params.id).lean();
        console.log('Story found:', {
          id: story?._id,
          title: story?.title,
          hasPdfFileId: !!story?.pdfFileId,
          hasPdfData: !!story?.pdfData,
          pdfDataLength: story?.pdfData?.length,
          pdfDataStart: story?.pdfData?.toString().substring(0, 50)  // Log first 50 chars of PDF data
        });

        if (!story) {
          console.error('Story not found:', req.params.id);
          res.status(404).json({ error: 'Story not found' });
          return;
        }

        console.log('Attempting to get PDF content...');
        const pdfBuffer = await mongoStoryService.getPDFContent(req.params.id);
        
        console.log('PDF content retrieved successfully, size:', pdfBuffer.length);
        console.log('PDF content starts with:', pdfBuffer.slice(0, 50).toString());  // Log start of PDF content
        
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
          fileName: req.file.originalname,
          mimeType: req.file.mimetype
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

        // Verify the PDF file
        if (!req.file.buffer) {
          throw new Error('PDF file buffer is missing');
        }

        // Check if it's a valid PDF
        const pdfHeader = req.file.buffer.slice(0, 4).toString();
        if (!pdfHeader.startsWith('%PDF')) {
          console.error('Invalid PDF header:', pdfHeader);
          res.status(400).json({ error: 'Invalid PDF file: Missing PDF header' });
          return;
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
        console.log('PDF file size:', req.file.size, 'bytes');

        const story = await mongoStoryService.createStory(storyData, req.file.buffer);
        res.status(201).json(story);
        return;
      } catch (error) {
        console.error('Error creating story:', error);
        res.status(400).json({ 
          error: 'Failed to create story',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
      }
    });

    app.put('/api/stories/:id', upload.single('pdf'), async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { title, description, language, readingLevel, categories, isActive } = req.body;
        const updatedStoryData: Partial<IStory> = { title, description, language, readingLevel, categories, isActive };
        
        if (req.file) {
          updatedStoryData.pdfData = req.file.buffer;
        }

        // Log received data for debugging
        console.log('Received update data:', {
          id,
          title,
          description,
          language,
          readingLevel,
          categories,
          isActive,
          fileSize: req.file?.size,
          fileName: req.file?.originalname,
          mimeType: req.file?.mimetype
        });
        
        const updatedStory = await mongoStoryService.updateStory(id, updatedStoryData);
        
        if (!updatedStory) {
          res.status(404).json({ error: 'Story not found or update failed.' });
          return;
        }
        res.json(updatedStory);
        return;
      } catch (error) {
        console.error('Error updating story:', error);
        res.status(500).json({ error: 'Failed to update story' });
        return;
      }
    });

    app.delete('/api/stories/:id', async (req: Request, res: Response) => {
      try {
        await mongoStoryService.deleteStory(req.params.id);
        res.status(204).send(); // No Content
        return;
      } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ error: 'Failed to delete story' });
        return;
      }
    });

    app.get('/api/stories/search', async (req: Request, res: Response) => {
      try {
        const { searchTerm } = req.query;
        if (!searchTerm) {
          res.status(400).json({ error: 'Search term is required' });
          return;
        }
        const stories = await mongoStoryService.searchStories(String(searchTerm));
        res.json(stories);
        return;
      } catch (error) {
        console.error('Error searching stories:', error);
        res.status(500).json({ error: 'Failed to search stories' });
        return;
      }
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB or initialize GridFS:', error);
    process.exit(1);
  }
})();