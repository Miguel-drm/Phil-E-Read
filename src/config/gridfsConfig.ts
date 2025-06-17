import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";

// Use require for CommonJS modules
const { GridFsStorage } = require('multer-gridfs-storage');

interface FileInfo {
  filename: string;
  bucketName: string;
  metadata: {
    originalname: string;
    contentType: string;
  };
}

interface MulterFile {
  originalname: string;
  mimetype: string;
}

let gridfsBucket: GridFSBucket;

// Initialize GridFS bucket
const initGridFSBucket = async () => {
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established');
  }
  gridfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'stories'
  });
  return gridfsBucket;
};

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/phileread',
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req: any, file: any) => {
    return {
      bucketName: 'stories',
      filename: `${Date.now()}-${file.originalname}`,
      metadata: {
        uploadedBy: req.user?.id,
        contentType: file.mimetype,
        grade: req.body?.grade
      }
    };
  }
});

export { storage, initGridFSBucket, gridfsBucket }; 