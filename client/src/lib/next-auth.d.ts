import "next-auth/next";

declare module "next-auth" {
  interface Session {
    user: User;
  }

  interface User {
    id: string;
    username: string;
    image: string;
    name: string;
  }
}
