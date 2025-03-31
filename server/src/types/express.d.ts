import { Request } from "express";

declare module "express" {
  interface Request {
    user?: JwtPayload | null;
    userDB?: User | null;
  }
}
