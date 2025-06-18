// app/api/friend-requests/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // Mongoose DB connection utility
import User from "@/models/User"; // Mongoose User model
import FriendRequest from "@/models/FriendRequest"; // Mongoose FriendRequest model
import Friendship from "@/models/Friendship"; // Mongoose Friendship model
import mongoose from "mongoose"; // Import mongoose for ObjectId conversion

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
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }
    const currentUserMongoId = currentUserMongo._id;

    // 4. Fetch friend requests where the current user is the recipient
    // Use .populate() to get the 'from' user's details directly
    const requests = await FriendRequest.find({
      toId: currentUserMongoId,
    }).populate('fromId', 'username email'); // Select 'username' and 'email' fields from the 'fromId' (User)

    // 5. Format the response
    const formattedRequests = requests.map(req => ({
      id: req.fromId._id, // The MongoDB _id of the sender
      name: req.fromId.username,
      email: req.fromId.email,
    }));

    return NextResponse.json(formattedRequests, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching friend requests:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate and get Clerk user information
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ error: "Missing username in request body" }, { status: 400 });
    }

    // 2. Connect to MongoDB
    await dbConnect();

    // 3. Find the MongoDB User ID for the current Clerk user
    const senderMongoUser = await User.findOne({ clerkId: clerkUser.id });
    if (!senderMongoUser) {
      return NextResponse.json({ error: "Sender user not found in database" }, { status: 404 });
    }
    const senderMongoId = senderMongoUser._id;

    // 4. Find the MongoDB User ID for the recipient by username
    const recipientMongoUser = await User.findOne({ username });
    if (!recipientMongoUser) {
      return NextResponse.json({ error: "Recipient user not found in database" }, { status: 404 });
    }
    const recipientMongoId = recipientMongoUser._id;

    // 5. Prevent sending request to self
    if (senderMongoId.equals(recipientMongoId)) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // 6. Check if a pending friend request already exists (sender -> recipient)
    const alreadyRequested = await FriendRequest.findOne({
      fromId: senderMongoId,
      toId: recipientMongoId,
    });
    if (alreadyRequested) {
      return NextResponse.json({ message: "Friend request already sent to this user" }, { status: 200 });
    }

    // 7. Check if a pending friend request already exists (recipient -> sender or sender -> recipient)
    // This covers cases where the request might have been sent the other way around.
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { fromId: senderMongoId, toId: recipientMongoId },
        { fromId: recipientMongoId, toId: senderMongoId },
      ],
    });
    if (existingRequest) {
      return NextResponse.json({ message: "A pending friend request already exists between you and this user" }, { status: 200 });
    }

    // 8. Check if they are already friends
    const alreadyFriends = await Friendship.findOne({
      $or: [
        { user1Id: senderMongoId, user2Id: recipientMongoId },
        { user1Id: recipientMongoId, user2Id: senderMongoId },
      ],
    });
    if (alreadyFriends) {
      return NextResponse.json({ message: "You are already friends with this user" }, { status: 200 });
    }

    // 9. Create the new friend request
    await FriendRequest.create({
      fromId: senderMongoId,
      toId: recipientMongoId,
    });

    return NextResponse.json({ message: "Friend request sent successfully!" }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error processing friend request:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
