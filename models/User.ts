import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Mongoose automatically adds an _id field as the primary key.
  // We'll add clerkId to link to Clerk's user ID.
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Add index for faster lookups
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Removed profileImageUrl as it will be managed by Clerk.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
