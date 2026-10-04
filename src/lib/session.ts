import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Checks that the staff member still exists in the database (auth() returns null if
// deleted). Otherwise sends them to /logout, which clears the old login — straight to
// /login doesn't work, because the proxy still sees the cookie and sends them back.
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/logout");
  return session;
}
