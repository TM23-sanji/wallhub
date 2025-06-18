// app/api/images/favorite/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // Mongoose DB connection utility
import User from "@/models/User"; // Mongoose User model
import Image from "@/models/Image"; // Mongoose Image model
import Favorite from "@/models/Favorite"; // Mongoose Favorite model
import mongoose from "mongoose"; // For ObjectId validation

export async function POST(req: Request) {
  try {
    // 1. Authenticate user with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // 2. Parse request body
    const { imageId } = await req.json();

    // 3. Validate request parameters
    if (!imageId) {
      return NextResponse.json({ error: "Invalid request: Missing imageId" }, { status: 400 });
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

    // 6. Check for existing favorite record by this user for this image
    const existingFavorite = await Favorite.findOne({ userId: currentUserId, imageId: mongoImageId });

    let favoritedStatus = false; // To be returned in the response

    if (existingFavorite) {
      // If favorite exists, remove it (toggle off)
      await Favorite.deleteOne({ _id: existingFavorite._id });
      // Decrement favoriteCount on the Image document
      await Image.findByIdAndUpdate(mongoImageId, { $inc: { favoriteCount: -1 } });
      favoritedStatus = false;
    } else {
      // If favorite does not exist, add it (toggle on)
      await Favorite.create({ userId: currentUserId, imageId: mongoImageId });
      // Increment favoriteCount on the Image document
      await Image.findByIdAndUpdate(mongoImageId, { $inc: { favoriteCount: 1 } });
      favoritedStatus = true;
    }

    return NextResponse.json({ favorited: favoritedStatus }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error processing favorite action:`, error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
