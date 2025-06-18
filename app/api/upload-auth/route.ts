// File: app/api/upload-auth/route.ts
import { getUploadAuthParams } from "@imagekit/next/server";
import { currentUser } from "@clerk/nextjs/server"; // Import currentUser for authentication
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Authenticate the user using Clerk
    const clerkUser = await currentUser();

    // If the user is not authenticated, return an unauthorized response
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    // Your application logic to further check permissions if needed
    // For example, if only certain roles can upload images:
    // if (!clerkUser.publicMetadata.canUpload) {
    //   return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    // }

    // Generate authentication parameters for ImageKit
    // Ensure IMAGEKIT_PRIVATE_KEY and IMAGEKIT_PUBLIC_KEY are defined in your .env.local file
    const { token, expire, signature } = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string, // This must be kept secret on the server
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string, // This is safe to expose client-side
      // Optional parameters:
      // expire: 30 * 60, // Controls the expiry time of the token in seconds (max 1 hour)
      // token: `user-${clerkUser.id}-${Date.now()}`, // A unique token for this request, tied to user
    });

    // Return the authentication parameters and public key to the client
    return NextResponse.json({ token, expire, signature, publicKey: process.env.IMAGEKIT_PUBLIC_KEY }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error generating ImageKit upload authentication parameters:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
