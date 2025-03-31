import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth",
  },
});

export const config = {
  matcher: ["/rooms/*"], // Only protect certain routes
};
