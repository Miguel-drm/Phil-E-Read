import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  title: string;
  description: string;
  grade: string;
  pdfFileId: mongoose.Types.ObjectId;
  textContent: string;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true
  },
  pdfFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'PDF file ID is required']
  },
  textContent: {
    type: String,
    required: [true, 'Text content is required'],
    trim: true
  }
}, {
  timestamps: true
});

// Add text index for search functionality
StorySchema.index({ title: 'text', description: 'text', textContent: 'text' });

export default mongoose.model<IStory>('Story', StorySchema);