"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react"; // For displaying errors

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define the Zod schema for your login form data
// This should ideally be in a shared location like '@/lib/schemas/auth.ts'
const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"), // Password should just be required here for login
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null); // State to hold authentication errors
  const { signIn, isLoaded, setActive } = useSignIn();

  const {
    register,
    handleSubmit,
    formState: { errors }, // Get form errors for display
  } = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof SignInSchema>) => {
    // If user is already signed in, redirect to home
    if (isSignedIn) {
      router.push("/");
      return;
    }
    // If Clerk is not loaded, prevent submission
    if (!isLoaded) return;

    setIsSubmitting(true);
    setAuthError(null); // Clear any previous authentication errors

    try {
      const response = await signIn.create({
        identifier: data.email, // Use 'identifier' for Clerk's sign-in API
        password: data.password,
      });

      if (response.status === "complete") {
        // Set the active Clerk session
        await setActive({ session: response.createdSessionId });
        // Redirect to home page upon successful login
        router.push("/");
      } else {
        // Handle cases where Clerk's API returns an incomplete status
        console.error("Sign-in incomplete:", response);
        setAuthError("Sign-in could not be completed. Please check your credentials and try again.");
      }
    } catch (error: any) { // Catch Clerk-specific errors during sign-in
      console.error("Clerk sign-in error:", error);
      // Attempt to extract a more user-friendly message from Clerk error object
      setAuthError(error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "An unexpected error occurred during sign-in. Please try again.");
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
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
                  Login with Google
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email" // Changed to type="email"
                    placeholder="john@wick.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
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
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                {/* Display general authentication error */}
                {authError && (
                  <div className="bg-red-100 text-red-700 flex justify-center items-center gap-2 p-2 rounded-md">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{authError}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting} // Disable button while submitting
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <span
                  onClick={() => router.push("/sign-up")} // Changed to /sign-up for Clerk's default route
                  className="underline underline-offset-4 cursor-pointer"
                >
                  Sign up
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
