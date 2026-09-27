import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        const username = credentials.username as string;
        const password = credentials.password as string;

        const existingUsers = await db.select().from(users).where(eq(users.username, username));
        
        let user = existingUsers[0];
        
        if (!user) {
          // Auto-register for simplicity in this demo game if they don't exist
          const newUsers = await db.insert(users).values({
            username: username,
            passwordHash: password,
          }).returning();
          user = newUsers[0];
        } else {
          // Verify password
          if (user.passwordHash !== password) {
            return null; // Invalid password
          }
        }

        return {
          id: user.id,
          name: user.username,
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
})
