import {z} from "zod";

export const SignUp = z.object({
    username: z.string().min(1, {message: "Username is required."}).max(100, {message: "Username is too long."}),
    email: z.string().email({message: "Invalid email address."}).min(1, {message: "Email is required."}).max(100, {message: "Email is too long."}),
    password: z.string().min(2, {message: "Password is required."}).max(100, {message: "Password is too long."}),
})