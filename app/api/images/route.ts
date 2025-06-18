// app/api/images/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import dbConnect from "@/lib/dbConnect"; // Mongoose DB connection utility
import User from "@/models/User"; // Mongoose User model
import Image from "@/models/Image"; // Mongoose Image model
import Comment from "@/models/Comment"; // Mongoose Comment model
import Like from "@/models/Like"; // Mongoose Like model
import Dislike from "@/models/Dislike"; // Mongoose Dislike model
import Favorite from "@/models/Favorite"; // Mongoose Favorite model
import Friendship from "@/models/Friendship"; // Mongoose Friendship model
import mongoose from "mongoose"; // For ObjectId, if explicit conversion needed

// Initialize ImageKit with environment variables
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // 2. Connect to MongoDB
    await dbConnect();

    // 3. Find the MongoDB User ID for the current Clerk user
    const uploaderMongo = await User.findOne({ clerkId: clerkUser.id });
    if (!uploaderMongo) {
      return NextResponse.json({ error: "Uploader user not found in database" }, { status: 404 });
    }
    const uploadedById = uploaderMongo._id;

    // 4. Parse request body
    const body = await req.json();
    const { url, fileId, fileWidth, fileHeight, alt } = body;

    // 5. Validate required fields
    if (!url || !fileId) {
      return NextResponse.json(
        { error: "Missing required fields: url or fileId" },
        { status: 400 }
      );
    }

    // 6. Create new Image document in MongoDB
    const image = await Image.create({
      url,
      fileId,
      fileWidth,
      fileHeight,
      alt: alt || "Image",
      uploadedById: uploadedById, // Use the MongoDB _id of the uploader
      // likes, dislikes, favoriteCount will default to 0 as per schema
      // createdAt will default to Date.now as per schema
    });

    // 7. Return the created image data
    return NextResponse.json({ image }, { status: 201 });

  } catch (error: unknown) {
    console.error("Error uploading image metadata to MongoDB:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 1. Authenticate user with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // 2. Connect to MongoDB
    await dbConnect();

    // 3. Find the MongoDB User ID for the current Clerk user
    const currentUserMongo = await User.findOne({ clerkId: clerkUser.id });
    if (!currentUserMongo) {
      return NextResponse.json({ error: "Current user not found in database" }, { status: 404 });
    }
    const currentUserMongoId = currentUserMongo._id;

    // 4. Get friend IDs (MongoDB ObjectIds)
    const friendships = await Friendship.find({
      $or: [
        { user1Id: currentUserMongoId },
        { user2Id: currentUserMongoId },
      ],
    });

    const friendMongoIds = friendships.map((f) =>
      f.user1Id.equals(currentUserMongoId) ? f.user2Id : f.user1Id
    );

    // 5. Combine current user's ID and friend IDs to get allowed uploader IDs
    const allowedImageUserIds = [currentUserMongoId, ...friendMongoIds];

    // 6. Fetch images uploaded by allowed users
    // Populate the 'uploadedBy' field to get the username
    const images = await Image.find({
      uploadedById: { $in: allowedImageUserIds },
    })
      .populate('uploadedById', 'username') // Populate with only the username of the uploader
      .sort({ createdAt: -1 }); // Order by createdAt descending

    // 7. Extract all image _ids for subsequent lookups
    const imageMongoIds = images.map(img => img._id);

    // 8. Fetch related data (Comments, Likes, Dislikes, Favorites)
    const comments = await Comment.find({ imageId: { $in: imageMongoIds } })
      .populate('userId', 'username'); // Populate with username of the comment author

    const likes = await Like.find({ imageId: { $in: imageMongoIds } });
    const dislikes = await Dislike.find({ imageId: { $in: imageMongoIds } });
    const favorites = await Favorite.find({ imageId: { $in: imageMongoIds } });

    // 9. Create maps for efficient lookup of related data by imageId
    const commentsMap = new Map();
    comments.forEach(comment => {
      const imgIdStr = comment.imageId.toString();
      if (!commentsMap.has(imgIdStr)) {
        commentsMap.set(imgIdStr, []);
      }
      commentsMap.get(imgIdStr).push({
        id: comment._id.toString(),
        content: comment.content,
        user: {
          username: comment.userId.username, // Populated username
        },
      });
    });

    const likesMap = new Map();
    likes.forEach(like => {
      const imgIdStr = like.imageId.toString();
      if (!likesMap.has(imgIdStr)) {
        likesMap.set(imgIdStr, []);
      }
      likesMap.get(imgIdStr).push(like.userId.toString()); // Store userId as string
    });

    const dislikesMap = new Map();
    dislikes.forEach(dislike => {
      const imgIdStr = dislike.imageId.toString();
      if (!dislikesMap.has(imgIdStr)) {
        dislikesMap.set(imgIdStr, []);
      }
      dislikesMap.get(imgIdStr).push(dislike.userId.toString()); // Store userId as string
    });

    const favoritesMap = new Map();
    favorites.forEach(favorite => {
      const imgIdStr = favorite.imageId.toString();
      if (!favoritesMap.has(imgIdStr)) {
        favoritesMap.set(imgIdStr, []);
      }
      favoritesMap.get(imgIdStr).push(favorite.userId.toString()); // Store userId as string
    });

    // 10. Transform the Mongoose objects into the desired frontend-friendly shape
    const response = images.map((img) => {
      const imgIdStr = img._id.toString();
      const currentUserIdStr = currentUserMongoId.toString(); // Current user's MongoDB ID as string

      const imgComments = commentsMap.get(imgIdStr) || [];
      const imgLikes = likesMap.get(imgIdStr) || [];
      const imgDislikes = dislikesMap.get(imgIdStr) || [];
      const imgFavorites = favoritesMap.get(imgIdStr) || [];

      return {
        id: img._id.toString(), // Convert ObjectId to string
        src: img.url,
        alt: img.alt,
        fileId: img.fileId,
        fileWidth: img.fileWidth,
        fileHeight: img.fileHeight,
        // The 'likes' and 'dislikes' fields on the Image model are direct counts.
        // We assume they are updated separately on like/dislike actions.
        likes: img.likes, // Direct count from Image document
        dislikes: img.dislikes, // Direct count from Image document
        isLiked: imgLikes.includes(currentUserIdStr), // Check if current user liked
        isDisliked: imgDislikes.includes(currentUserIdStr), // Check if current user disliked
        commentCount: imgComments.length,
        favoriteCount: imgFavorites.length, // Count from the fetched favorites
        uploadedByUsername: (img.uploadedById as any).username, // Populated username
        isFavorited: imgFavorites.includes(currentUserIdStr), // Check if current user favorited
        comments: imgComments, // Array of formatted comments
      };
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    console.error("Error fetching images:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // 1. Authenticate user with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // 2. Parse request body
    const { imageId } = await req.json();
    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId in request body" }, { status: 400 });
    }

    // Validate imageId format (optional but good practice for ObjectId)
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return NextResponse.json({ error: "Invalid imageId format" }, { status: 400 });
    }
    const mongoImageId = new mongoose.Types.ObjectId(imageId);

    // 3. Connect to MongoDB
    await dbConnect();

    // 4. Find the MongoDB User ID for the current Clerk user
    const deleterMongo = await User.findOne({ clerkId: clerkUser.id });
    if (!deleterMongo) {
      return NextResponse.json({ error: "Deleter user not found in database" }, { status: 404 });
    }
    const deleterMongoId = deleterMongo._id;

    // 5. Find the image and verify ownership
    const image = await Image.findById(mongoImageId);

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Check if the current user is the uploader of the image
    if (!image.uploadedById.equals(deleterMongoId)) {
      return NextResponse.json({ error: "Forbidden: Not authorized to delete this image" }, { status: 403 });
    }

    // 6. Delete image from ImageKit
    await imagekit.deleteFile(image.fileId);

    // 7. Clean up related documents in MongoDB
    // Delete comments, favorites, likes, and dislikes associated with the image
    await Comment.deleteMany({ imageId: mongoImageId });
    await Favorite.deleteMany({ imageId: mongoImageId });
    await Like.deleteMany({ imageId: mongoImageId });
    await Dislike.deleteMany({ imageId: mongoImageId });

    // 8. Delete the image document itself from MongoDB
    await Image.deleteOne({ _id: mongoImageId });

    return NextResponse.json({ message: "Image and associated data deleted successfully" }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error deleting image:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
