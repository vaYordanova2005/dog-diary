import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Uses only the light config (no Prisma), because the proxy runs in the Edge runtime.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|svg|webp|gif)$).*)",
  ],
};
