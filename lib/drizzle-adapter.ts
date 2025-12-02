import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "next-auth/adapters";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type ExtendedAdapterUser = AdapterUser & {
  lineId?: string | null;
};

type DbUser = InferSelectModel<typeof users>;

function toAdapterUser(dbUser: DbUser): AdapterUser {
  return {
    id: dbUser.id,
    name: dbUser.name ?? undefined,
    email: dbUser.email ?? "",
    emailVerified: dbUser.emailVerified ?? null,
    image: dbUser.image ?? undefined,
  };
}

export function DrizzleAdapter(): Adapter {
  return {
    async createUser(user: AdapterUser) {
      const extendedUser = user as ExtendedAdapterUser;
      const [createdUser] = await db
        .insert(users)
        .values({
          name: user.name ?? null,
          email: user.email ?? null,
          emailVerified: user.emailVerified ?? null,
          image: user.image ?? null,
          lineId: extendedUser.lineId ?? null,
          })
        .returning();
      return toAdapterUser(createdUser);
    },
    async getUser(id) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const [result] = await db
        .select({
          user: users,
        })
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider)
          )
        )
        .limit(1);
      return result?.user ? toAdapterUser(result.user) : null;
    },
    async updateUser(user) {
      const extendedUser = user as ExtendedAdapterUser;
      const [updatedUser] = await db
        .update(users)
        .set({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          lineId: extendedUser.lineId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      return toAdapterUser(updatedUser);
    },
    async linkAccount(account: AdapterAccount) {
      await db.insert(accounts).values({
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });
    },
    async createSession({ sessionToken, userId, expires }) {
      const [session] = await db
        .insert(sessions)
        .values({
          sessionToken,
          userId,
          expires,
        })
        .returning();
      return session;
    },
    async getSessionAndUser(sessionToken) {
      const [result] = await db
        .select({
          session: sessions,
          user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);
      return result
        ? {
            session: result.session as AdapterSession,
            user: toAdapterUser(result.user),
          }
        : null;
    },
    async updateSession({ sessionToken, ...session }) {
      const [updatedSession] = await db
        .update(sessions)
        .set(session)
        .where(eq(sessions.sessionToken, sessionToken))
        .returning();
      return updatedSession;
    },
    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },
    async createVerificationToken({ identifier, expires, token }) {
      const [verificationToken] = await db
        .insert(verificationTokens)
        .values({
          identifier,
          expires,
          token,
        })
        .returning();
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      const [verificationToken] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        )
        .limit(1);
      if (verificationToken) {
        await db
          .delete(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, identifier),
              eq(verificationTokens.token, token)
            )
          );
      }
      return verificationToken || null;
    },
  };
}

