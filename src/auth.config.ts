import type { NextAuthConfig } from "next-auth";

// Light config with no database access — used by the proxy (middleware)
// (Edge runtime), where Prisma can't run.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register");

      if (!isLoggedIn && !isAuthPage) return false;
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.remember = (user as { remember?: boolean }).remember;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
