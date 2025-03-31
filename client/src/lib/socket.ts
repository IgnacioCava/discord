"use client";

import { io } from "socket.io-client";
import { getSession } from "next-auth/react";

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
  {
    withCredentials: true,
    autoConnect: false,
  }
);

console.log("Socket instance created");

export const connectSocket = async () => {
  const session = await getSession(); // ✅ Get the session data
  if (session?.user.idToken) {
    socket.auth = { token: session.user.idToken, id: session.user.id }; // ✅ Add token to auth property
  }
  socket.connect(); // ✅ Connect only after setting auth
};

export default socket;

// import GoogleProvider from "next-auth/providers/google";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import prisma from "./prisma";
// import { NextAuthOptions } from "next-auth";

// const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET } = process.env;

// export const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     GoogleProvider({
//       clientId: GOOGLE_CLIENT_ID as string,
//       clientSecret: GOOGLE_CLIENT_SECRET as string,
//       authorization: {
//         params: {
//           scope: "openid profile email", // Customize scopes here
//         },
//       },
//     }),
//     // Add more providers if necessary
//   ],
//   session: {
//     strategy: "database",
//   },
//   secret: NEXTAUTH_SECRET,
//   callbacks: {
//     // The jwt callback is called when a JWT is created (after sign-in)
//     async jwt({ token, account, user }) {
//       // If it's a new session (sign-in), add id_token to the JWT
//       console.log({token, account})
//       if (account) {
//         token.accessToken = account.access_token;
//         token.refreshToken = account.refresh_token; // Store the refresh token
//         token.id_token = account.id_token; // Store the id_token from the account
//         if (account?.expires_at)
//           token.expiresAt = Date.now() + account?.expires_at * 1000; // Set the expiration time
//       }
//       if (user) {
//         token.id = user.id; // Store the user ID in the token
//       }
//       if (token.expiresAt && (token.expiresAt as number) < Date.now()) {
//         // Use the refresh token to get a new access token
//         const refreshedToken = await refreshAccessToken(
//           token.refreshToken as string
//         );
//         token.accessToken = refreshedToken.access_token;
//         token.expiresAt = Date.now() + refreshedToken.expires_in * 1000;
//       }
//       return token;
//     },

//     async session({ session, token }) {
//       // Attach the id_token from the JWT to the session
//       if (token.id_token) {
//         session.user.idToken = token.id_token as string; // Add it to session user
//         console.log(token);
//       }
//       if (token?.id) {
//         session.user.id = token.id as string; // Attach user ID to session
//       }
//       return session;
//     },
//   },
// };

// async function refreshAccessToken(refreshToken: string) {
//   const response = await fetch("https://oauth2.googleapis.com/token", {
//     method: "POST",
//     body: new URLSearchParams({
//       client_id: process.env.GOOGLE_CLIENT_ID!,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET!,
//       refresh_token: refreshToken,
//       grant_type: "refresh_token",
//     }),
//   });

//   const data = await response.json();
//   return data;
// }
