import mongoose from 'mongoose';

const FriendRequestSchema = new mongoose.Schema({
  fromId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User's _id (sender)
    ref: 'User',
    required: true,
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User's _id (receiver)
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Consider adding a unique index for (fromId, toId) to prevent duplicate requests
FriendRequestSchema.index({ fromId: 1, toId: 1 }, { unique: true });

export default mongoose.models.FriendRequest || mongoose.model('FriendRequest', FriendRequestSchema);
