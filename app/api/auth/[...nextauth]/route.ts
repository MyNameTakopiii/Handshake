import NextAuth from "next-auth";
import { DrizzleAdapter } from "@/lib/drizzle-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Session, User } from "next-auth";
import LineProvider from "next-auth/providers/line";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(),
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID || "",
      clientSecret: process.env.LINE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "line" && account.providerAccountId) {
          // Store LINE ID when user signs in
          const { db } = await import("@/lib/db");
          const { users } = await import("@/db/schema");
          const { eq } = await import("drizzle-orm");
          
          if (user.id) {
            await db
              .update(users)
              .set({ lineId: account.providerAccountId })
              .where(eq(users.id, user.id));
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return true; // Allow sign in even if LINE ID update fails
      }
    },
    session: async ({ session, user }: { session: Session; user: User }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
