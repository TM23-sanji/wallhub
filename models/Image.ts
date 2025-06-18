import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
  },
  fileId: { // This could be the ImageKit fileId
    type: String,
    required: true,
  },
  fileWidth: {
    type: Number,
  },
  fileHeight: {
    type: Number,
  },
  uploadedById: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User's _id
    ref: 'User',
    required: true,
    index: true, // Index for faster lookups by uploader
  },
  likes: {
    type: Number,
    required: true,
    default: 0,
  },
  dislikes: {
    type: Number,
    required: true,
    default: 0,
  },
  favoriteCount: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);
