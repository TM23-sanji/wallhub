import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User's _id
    ref: 'User',
    required: true,
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to Image's _id
    ref: 'Image',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a unique compound index to ensure a user can only like an image once
LikeSchema.index({ userId: 1, imageId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model('Like', LikeSchema);
