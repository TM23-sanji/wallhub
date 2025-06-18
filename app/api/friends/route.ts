// app/api/friends/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // Mongoose DB connection utility
import User from "@/models/User"; // Mongoose User model
import FriendRequest from "@/models/FriendRequest"; // Mongoose FriendRequest model
import Friendship from "@/models/Friendship"; // Mongoose Friendship model
import mongoose from "mongoose"; // Required for ObjectId comparison

export async function GET() {
  try {
    // 1. Authenticate and get Clerk user information
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Connect to MongoDB
    await dbConnect();

    // 3. Find the MongoDB User ID for the current Clerk user
    const currentUserMongo = await User.findOne({ clerkId: clerkUser.id });
    if (!currentUserMongo) {
      return NextResponse.json({ error: "Current user not found in database" }, { status: 404 });
    }
    const currentUserMongoId = currentUserMongo._id;

    // 4. Fetch friendships where the current user is either user1Id or user2Id
    // Use .populate() to get the details of both associated users
    const friendships = await Friendship.find({
      $or: [
        { user1Id: currentUserMongoId },
        { user2Id: currentUserMongoId },
      ],
    })
      .populate('user1Id', 'username email') // Populate user1 details
      .populate('user2Id', 'username email'); // Populate user2 details

    // 5. Format the response to return the 'other' friend's details
    const friends = friendships.map(f => {
      // Determine which user is the 'friend' (the one not the current user)
      const friendData = f.user1Id._id.equals(currentUserMongoId) ? f.user2Id : f.user1Id;

      return {
        id: friendData._id.toString(), // Convert ObjectId to string for client-side use
        name: friendData.username,
        // isOnline: Math.random() > 0.5, // Replace with real presence logic if needed
        // For now, retaining the random online status as per original code, but this would be external.
        isOnline: Math.random() > 0.5,
      };
    });

    return NextResponse.json(friends, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching friends:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate and get Clerk user information
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    // 2. Connect to MongoDB
    await dbConnect();

    // 3. Find the MongoDB User ID for the current Clerk user (the recipient of the request)
    const currentUserMongo = await User.findOne({ clerkId: clerkUser.id });
    if (!currentUserMongo) {
      return NextResponse.json({ error: "Current user not found in database" }, { status: 404 });
    }
    const currentUserMongoId = currentUserMongo._id; // This is 'toId' in the friend request

    // 4. Find the MongoDB User ID for the user who sent the request ('fromId')
    const fromUserMongo = await User.findOne({ username });
    if (!fromUserMongo) {
      return NextResponse.json({ error: "User who sent request not found" }, { status: 404 });
    }
    const fromUserMongoId = fromUserMongo._id; // This is 'fromId' in the friend request

    // 5. Check if the friend request exists
    const request = await FriendRequest.findOne({
      fromId: fromUserMongoId,
      toId: currentUserMongoId,
    });

    if (!request) {
      return NextResponse.json({ error: "No pending friend request from this user" }, { status: 404 });
    }

    // 6. Ensure consistent order for user IDs in Friendship (for unique index)
    // Mongoose ObjectIds can be compared lexicographically, but ensure consistent sorting logic
    const sortedUserIds = [currentUserMongoId, fromUserMongoId].sort((a, b) => {
      // Convert to string for consistent comparison if needed, or rely on native ObjectId comparison
      return a.toString().localeCompare(b.toString());
    });
    const user1Id = sortedUserIds[0];
    const user2Id = sortedUserIds[1];

    // 7. Check if they are already friends (important before creating)
    const alreadyFriends = await Friendship.findOne({
      $or: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id }, // Check both permutations for robustness
      ],
    });
    if (alreadyFriends) {
      // Even though we sorted, double-check if they are already friends due to previous logic
      await FriendRequest.deleteOne({ _id: request._id }); // Clean up the request if friendship already exists
      return NextResponse.json({ message: "Already friends, request cleaned up" }, { status: 200 });
    }


    // 8. Create friendship
    await Friendship.create({
      user1Id,
      user2Id,
    });

    // 9. Delete the accepted friend request
    await FriendRequest.deleteOne({ _id: request._id }); // Use _id to delete specific document

    return NextResponse.json({ message: "Friend request accepted and friendship created" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error accepting friend request:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // 1. Authenticate and get Clerk user information
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    // 2. Connect to MongoDB
    await dbConnect();

    // 3. Find the MongoDB User ID for the current Clerk user
    const currentUserMongo = await User.findOne({ clerkId: clerkUser.id });
    if (!currentUserMongo) {
      return NextResponse.json({ error: "Current user not found in database" }, { status: 404 });
    }
    const currentUserMongoId = currentUserMongo._id;

    // 4. Find the MongoDB User ID for the friend to be removed
    const friendMongo = await User.findOne({ username });
    if (!friendMongo) {
      return NextResponse.json({ error: "Friend user not found" }, { status: 404 });
    }
    const friendMongoId = friendMongo._id;

    // 5. Delete friendship if it exists
    // Use $or to cover both permutations (user1Id, user2Id) or (user2Id, user1Id)
    const deletedResult = await Friendship.deleteOne({
      $or: [
        { user1Id: currentUserMongoId, user2Id: friendMongoId },
        { user1Id: friendMongoId, user2Id: currentUserMongoId },
      ],
    });

    if (deletedResult.deletedCount === 0) {
      return NextResponse.json({ error: "Friendship not found or already removed" }, { status: 404 });
    }

    return NextResponse.json({ message: "Friend successfully removed" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error deleting friend:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
