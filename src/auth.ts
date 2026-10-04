import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { encode as defaultEncode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { DEMO_USERNAMES, isDemoMode } from "@/lib/demo";

// If "Remember me" is unchecked, the session expires after a few hours instead
// of the standard 30 days (see jwt.encode below).
const SHORT_SESSION_SECONDS = 60 * 60 * 8;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
        remember: {},
        demo: {},
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        const remember = credentials?.remember !== "false";

        // One-click demo login: only when DEMO_MODE is on, and only for the demo accounts
        const demoLogin =
          credentials?.demo === "true" &&
          isDemoMode() &&
          !!username &&
          DEMO_USERNAMES.includes(username.trim().toLowerCase());

        if (!username || (!password && !demoLogin)) return null;

        // Upper/lower case in the username doesn't matter
        const user = await prisma.user.findFirst({
          where: { username: { equals: username.trim(), mode: "insensitive" } },
        });
        if (!user) return null;

        if (!demoLogin) {
          const passwordsMatch = await bcrypt.compare(password!, user.passwordHash);
          if (!passwordsMatch) return null;
        }

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          remember,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Here (Node.js, not Edge) the role is re-read from the database on every
    // check — a role change via prisma studio applies immediately, no logout/login.
    // A deleted user loses their session.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (!params.user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, name: true },
        });
        if (!dbUser) return null;
        token.role = dbUser.role;
        token.name = dbUser.name;
      }
      return token;
    },
  },
  jwt: {
    encode: async (params) => {
      const remember = (params.token as { remember?: boolean } | undefined)?.remember;
      if (remember === false) {
        return defaultEncode({ ...params, maxAge: SHORT_SESSION_SECONDS });
      }
      return defaultEncode(params);
    },
  },
});
