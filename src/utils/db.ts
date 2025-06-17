import mongoose from 'mongoose';
import { initGridFS } from '../services/gridfsService';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      // These options help with connection stability
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      wtimeoutMS: 2500
    });

    console.log('MongoDB Connected Successfully');

    // Initialize GridFS after connection
    initGridFS();
    console.log('GridFS initialized');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      initGridFS(); // Re-initialize GridFS after reconnection
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit the process, just log the error
    console.error('Failed to connect to MongoDB. Please check your connection settings and try again.');
  }
};

export default connectDB;