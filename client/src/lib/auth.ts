import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import { NextAuthOptions } from "next-auth";
import { signOut } from "next-auth/react";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET } = process.env;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,

      authorization: {
        params: {
          scope: "openid profile email", // Customize scopes here
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    // Add more providers if necessary
  ],
  session: {
    strategy: "jwt",
  },
  secret: NEXTAUTH_SECRET,
  callbacks: {
    // THIS JWT ONLY WORKS FOR GOOGLE, MAKE A CUSTOM ONE FOR EMAIL AUTH

    // The jwt callback is called when a JWT is created (after sign-in)
    async jwt({ token, account, user }) {
      // If it's a new session (sign-in), add id_token to the JWT
      if (account && account.id_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Store the refresh token
        token.id_token = account.id_token; // Store the id_token from the account
        console.log("expat", account.expires_at);
        if (account?.expires_at) token.expiresAt = account?.expires_at * 1000; // Set the expiration time
      }

      if (user) {
        token.id = user.id; // Store the user ID in the token
      }
      if (token.expiresAt && (token.expiresAt as number) - Date.now() < 0) {
        // Use the refresh token to get a new access token
        const refreshedToken = await refreshAccessToken(
          token.refreshToken as string
        );
        token.id_token = refreshedToken.id_token;
        token.accessToken = refreshedToken.access_token;
        token.expiresAt = Date.now() + refreshedToken.expires_in * 1000;
      }
      return token;
    },

    async session({ session, token }) {
      // Attach the id_token from the JWT to the session
      //console.log({token})
      if (token.id_token) {
        session.user.idToken = token.id_token as string; // Add it to session user
      }
      if (token?.id) {
        session.user.id = token.id as string; // Attach user ID to session
      }
      if (token.expiresAt && (token.expiresAt as number) - Date.now() < 0) {
        // If the token expired and was not refreshed, sign out the user
        const refreshedToken = await refreshAccessToken(
          token.refreshToken as string
        );
        console.log({ refreshedToken });
        if (refreshedToken.error && refreshedToken.error === "invalid_grant")
          await signOut({ redirect: false });
        token.accessToken = refreshedToken.access_token;
        token.expiresAt = Date.now() + refreshedToken.expires_in * 1000;
        token.id_token = refreshedToken.id_token;
      }
      return session;
    },
  },
};

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  return data;
}
