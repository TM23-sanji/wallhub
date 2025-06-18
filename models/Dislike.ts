import mongoose from 'mongoose';

const DislikeSchema = new mongoose.Schema({
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

// Add a unique compound index to ensure a user can only dislike an image once
DislikeSchema.index({ userId: 1, imageId: 1 }, { unique: true });

export default mongoose.models.Dislike || mongoose.model('Dislike', DislikeSchema);
