// app/api/images/comment/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // Mongoose DB connection utility
import User from "@/models/User"; // Mongoose User model
import Comment from "@/models/Comment"; // Mongoose Comment model
import mongoose from "mongoose"; // For ObjectId validation

export async function POST(req: Request) {
  try {
    // 1. Authenticate user with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // 2. Parse request body
    const { imageId, content } = await req.json();

    // 3. Validate request parameters
    if (!imageId || !content) {
      return NextResponse.json({ error: "Missing required fields: imageId or content" }, { status: 400 });
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

    // 6. Create new Comment document in MongoDB
    const newComment = await Comment.create({
      userId: currentUserId, // Use the MongoDB _id of the current user
      imageId: mongoImageId,
      content,
      // createdAt will default to Date.now as per schema
    });

    // 7. Populate the user's username for the response, similar to Prisma's include
    const createdCommentWithUser = await Comment.findById(newComment._id)
      .populate('userId', 'username'); // Populate with only the username

    // 8. Format the response
    const formattedComment = {
      id: createdCommentWithUser!._id.toString(), // Convert ObjectId to string
      content: createdCommentWithUser!.content,
      user: {
        username: (createdCommentWithUser!.userId as any).username, // Access populated username
      },
    };

    return NextResponse.json({ comment: formattedComment }, { status: 201 });

  } catch (error: unknown) {
    console.error(`Error creating comment:`, error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // 1. Authenticate user with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // 2. Extract imageId from URL search parameters
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    // 3. Validate imageId
    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId in query parameters" }, { status: 400 });
    }

    // Validate imageId format
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return NextResponse.json({ error: "Invalid imageId format" }, { status: 400 });
    }
    const mongoImageId = new mongoose.Types.ObjectId(imageId);

    // 4. Connect to MongoDB
    await dbConnect();

    // 5. Fetch comments for the given imageId, populating user details
    const comments = await Comment.find({ imageId: mongoImageId })
      .populate('userId', 'username') // Populate with only the username of the comment author
      .sort({ createdAt: -1 }); // Order by createdAt descending

    // 6. Format the response
    const formattedComments = comments.map((comment) => ({
      id: comment._id.toString(), // Convert ObjectId to string
      content: comment.content,
      user: {
        username: (comment.userId as any).username, // Access populated username
      },
    }));

    return NextResponse.json(formattedComments, { status: 200 });

  } catch (error: unknown) {
    console.error("Error fetching comments:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
