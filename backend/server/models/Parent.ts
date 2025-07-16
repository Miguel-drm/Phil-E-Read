import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profileImage: { type: String }, // base64 string
  banner: { type: String }, // banner image URL or base64 string
  // Add other parent fields as needed
}, { timestamps: true, collection: 'Parent' });

const Parent = mongoose.model('Parent', parentSchema);

export default Parent;
