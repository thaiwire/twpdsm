import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config (no Prisma/bcrypt) used by middleware to check
 * session presence only. The Credentials provider itself lives in auth.ts,
 * which runs in the Node.js runtime.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = token.departmentName as string;
      }
      return session;
    },
  },
};
