import { signOut } from "@/auth";

// Clears the login cookie and redirects to /login (see requireUser)
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
