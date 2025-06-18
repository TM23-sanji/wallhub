"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth, useSignUp } from "@clerk/nextjs";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Assuming your Zod schema for form validation is defined here:
// For example, in a file like `@/lib/schemas/auth.ts`
const SignUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"), // <--- Here the field is named 'email'
  password: z.string().min(8, "Password must be at least 8 characters."),
});

// Update the import path to match where your Zod schema is actually located.
// import { SignUpSchema } from "@/lib/schemas/auth"; // Example of a more conventional path

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp, isLoaded, setActive } = useSignUp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null); // Renamed for clarity
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof SignUpSchema>) => {
    if (isSignedIn) {
      router.push("/");
      return; // Stop execution if already signed in
    }
    if (!isLoaded) return; // Clerk hooks might not be ready yet

    setIsSubmitting(true);
    setAuthError(null); // Clear previous errors

    try {
      // --- DEBUGGING LOG ---
      console.log("Attempting Clerk sign-up with:");
      console.log("  Username:", data.username);
      console.log("  Email Address:", data.email);
      console.log("  Password (length):", data.password.length);
      // --- END DEBUGGING LOG ---

      await signUp.create({
        username: data.username,
        emailAddress: data.email, // <--- This line is the likely culprit, but should be correct
        password: data.password,
      });

      // After successful sign-up creation in Clerk, prepare for email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true); // Switch to verification step
    } catch (error: any) { // Catch Clerk-specific errors
      console.error("Clerk sign-up error:", error);
      // Attempt to extract a more user-friendly message from Clerk error
      setAuthError(error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "An unexpected error occurred during sign-up. Please try again.");
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleVerificationSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault(); // Prevent default form submission
    if (!isLoaded || !signUp) return; // Clerk hooks might not be ready

    setIsSubmitting(true);
    setVerificationError(null); // Clear previous verification errors

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        // Set the active session after successful verification
        await setActive({ session: result.createdSessionId });

        // Call your backend API to save user details to MongoDB
        const mongoResponse = await fetch("/api/create-user", {
          method: "POST",
        });

        if (!mongoResponse.ok) {
          // Log specific error from your backend if available
          const errorData = await mongoResponse.json();
          console.error("MongoDB user creation failed:", errorData.error);
          // Decide if you want to block navigation or just log
          // For a critical error like this, you might want to show a strong error message.
          setVerificationError(errorData.error || "Failed to sync user data to database. Please contact support.");
          // You might choose NOT to redirect if this is a critical failure.
          // return;
        }

        // Redirect to home page upon successful sign-up and user creation in DB
        router.push("/");
      } else {
        // Handle cases where verification is not 'complete' but no error was thrown
        console.warn("Email verification status:", result.status);
        setVerificationError("Verification incomplete. Please check the code or try again.");
      }
    } catch (error: any) { // Catch Clerk-specific verification errors
      console.error("Clerk verification error:", error);
      setVerificationCode(""); // Clear code input on error
      setVerificationError(
        error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "An error occurred during verification. Please try again."
      );
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  // Render verification form if in verifying state
  if (verifying) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verify Your Email</CardTitle>
          </CardHeader>
          <CardDescription>
            {!verificationError && (
              <p className="text-muted-foreground text-sm text-center">
                We&apos;ve sent a verification code to your email
              </p>
            )}
            {verificationError && (
              <div className="bg-red-100 text-red-700 flex justify-center items-center gap-2 p-2 rounded-md">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{verificationError}</p>
              </div>
            )}
          </CardDescription>
          <CardContent>
            <form onSubmit={handleVerificationSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <div className="grid gap-3 justify-center"> {/* Centered InputOTP group */}
                    <InputOTP
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(value) => setVerificationCode(value)}
                      onComplete={(value) => setVerificationCode(value)}
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verifying..." : "Verify Email"}
                  </Button>
                </div>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-default-500">
                Didn&apos;t receive a code?{" "}
                <button
                  onClick={async () => {
                    if (signUp) {
                      setVerificationError(null); // Clear error before resending
                      setIsSubmitting(true);
                      try {
                        await signUp.prepareEmailAddressVerification({
                          strategy: "email_code",
                        });
                        // Optionally provide a toast message that code was resent
                        console.log("Verification code resent.");
                      } catch (error: any) {
                        console.error("Resend code error:", error);
                        setVerificationError(error.errors?.[0]?.message || "Failed to resend code.");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  className="text-primary hover:underline font-medium"
                  disabled={isSubmitting} // Disable resend button while submitting
                >
                  Resend code
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render initial sign-up form
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              {/* Social Login Button - currently non-functional, purely visual */}
              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Google
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Username</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Wick"
                    {...register("username")} // No required: true here as it's handled by ZodResolver
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email" // Use type="email" for better browser validation
                    placeholder="john@wick.com"
                    {...register("email")} // No required: true here as it's handled by ZodResolver
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {/* Consider making this a functional link or a button with onClick */}
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="*************"
                    {...register("password")} // No required: true here as it's handled by ZodResolver
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>
                {/* Display general sign-up error */}
                {authError && (
                  <div className="bg-red-100 text-red-700 flex justify-center items-center gap-2 p-2 rounded-md">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{authError}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <span
                  onClick={() => router.push("/sign-in")} // Changed to /sign-in for Clerk's default route
                  className="underline underline-offset-4 cursor-pointer"
                >
                  Login here
                </span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
