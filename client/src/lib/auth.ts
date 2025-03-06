import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Add more providers if necessary
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // The jwt callback is called when a JWT is created (after sign-in)
    async jwt({ token, user }) {
      if (user) {
        // Add user id to token on initial sign-in
        token.id = user.id as string;
      }
      return token;
    },
    // The session callback is called when a session is being returned
    async session({ session, token }) {
      // Check if token contains an id, then set session user id
      if (token.id && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
};
