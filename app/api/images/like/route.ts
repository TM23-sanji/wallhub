// app/api/images/like/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // Mongoose DB connection utility
import User from "@/models/User"; // Mongoose User model
import Image from "@/models/Image"; // Mongoose Image model
import Like from "@/models/Like"; // Mongoose Like model
import Dislike from "@/models/Dislike"; // Mongoose Dislike model
import mongoose from "mongoose"; // For ObjectId validation

export async function POST(req: Request) {
  try {
    // 1. Authenticate user with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // 2. Parse request body
    const { imageId, action } = await req.json();

    // 3. Validate request parameters
    if (!imageId || !["like", "dislike"].includes(action)) {
      return NextResponse.json({ error: "Invalid request: Missing imageId or invalid action" }, { status: 400 });
    }

    // Validate imageId format
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return NextResponse.json({ error: "Invalid imageId format" }, { status: 400 });
    }
    const mongoImageId = new mongoose.Types.ObjectId(imageId);

    // 4. Connect to MongoDB
    await dbConnect();

    // 5. Find the MongoDB User ID for the current Clerk user
    const currentUserMongo = await User.findOne({ clerkId: clerkUser.id });
    if (!currentUserMongo) {
      return NextResponse.json({ error: "Current user not found in database" }, { status: 404 });
    }
    const currentUserId = currentUserMongo._id; // This is the ObjectId of the current user

    // 6. Check for existing like and dislike records by this user for this image
    const existingLike = await Like.findOne({ userId: currentUserId, imageId: mongoImageId });
    const existingDislike = await Dislike.findOne({ userId: currentUserId, imageId: mongoImageId });

    // 7. Handle 'like' action
    if (action === "like") {
      // If currently disliked, remove the dislike and decrement image's dislike count
      if (existingDislike) {
        await Dislike.deleteOne({ _id: existingDislike._id });
        await Image.findByIdAndUpdate(mongoImageId, { $inc: { dislikes: -1 } });
      }

      // If not already liked, add a new like and increment image's like count
      if (!existingLike) {
        await Like.create({ userId: currentUserId, imageId: mongoImageId });
        await Image.findByIdAndUpdate(mongoImageId, { $inc: { likes: 1 } });
      }
    }

    // 8. Handle 'dislike' action
    if (action === "dislike") {
      // If currently liked, remove the like and decrement image's like count
      if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        await Image.findByIdAndUpdate(mongoImageId, { $inc: { likes: -1 } });
      }

      // If not already disliked, add a new dislike and increment image's dislike count
      if (!existingDislike) {
        await Dislike.create({ userId: currentUserId, imageId: mongoImageId });
        await Image.findByIdAndUpdate(mongoImageId, { $inc: { dislikes: 1 } });
      }
    }

    return NextResponse.json({ success: true, message: `Image ${action}d successfully` }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error processing like/dislike action:`, error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
