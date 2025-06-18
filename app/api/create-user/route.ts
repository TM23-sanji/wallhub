// app/api/create-user/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // Import your Mongoose connection utility
import User from "@/models/User"; // Import your Mongoose User model

export async function POST() {
  try {
    // 1. Authenticate and get Clerk user information
    const clerkUser = await currentUser();

    // Check if Clerk user is authenticated
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract necessary user details from Clerk
    const username = clerkUser.username;
    const email = clerkUser.primaryEmailAddress?.emailAddress;

    // Validate if essential Clerk user data is present
    if (!username || !email) {
      return NextResponse.json({ error: "Invalid Clerk user data (username or email missing)" }, { status: 400 });
    }

    // 2. Connect to MongoDB
    // Assuming dbConnect already handles the connection string from .env.local
    // and connects to the default database (e.g., 'walltribe' as per our last discussion).
    await dbConnect();

    // 3. Check if user already exists in MongoDB using the 'clerkId'
    // The 'id' from Clerk corresponds to 'clerkId' in our Mongoose User schema.
    const existingUser = await User.findOne({ clerkId: clerkUser.id });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists in DB" }, { status: 200 });
    }

    // 4. Create new user in MongoDB
    await User.create({
      clerkId: clerkUser.id, // Store Clerk's ID as clerkId in MongoDB
      username,
      email,
      // createdAt will be set by default in the schema
    });

    return NextResponse.json({ message: "User successfully created in DB" }, { status: 200 });
  } catch (error: unknown) {
    // Enhanced error logging
    console.error("Error creating user in MongoDB:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
