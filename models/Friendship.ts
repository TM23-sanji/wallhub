import mongoose from 'mongoose';

const FriendshipSchema = new mongoose.Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User's _id
    ref: 'User',
    required: true,
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User's _id
    ref: 'User',
    required: true,
  },
  since: {
    type: Date,
    default: Date.now,
  },
});

// Add a unique compound index to ensure uniqueness regardless of order (e.g., A-B is same as B-A)
// This requires a custom function for normalization before saving.
// For simplicity in schema definition, we'll enforce uniqueness here,
// and handle sorting of IDs in application logic before creating/querying.
FriendshipSchema.index(
  { user1Id: 1, user2Id: 1 },
  { unique: true, partialFilterExpression: { user1Id: { $lt: "$user2Id" } } } // This helps enforce uniqueness for sorted pairs
);
// Alternatively, if you sort IDs before saving:
// FriendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

export default mongoose.models.Friendship || mongoose.model('Friendship', FriendshipSchema);
