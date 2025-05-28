// routes/meRouter.ts
import express from "express";
import { authenticateUser } from "@middleware/auth";
import {
  getFriendList,
  sendFriendRequest,
  answerFriendRequest,
} from "@controllers/userRelationshipController";
import meRouter from "./meRouter";

const router = express.Router();

router.use(authenticateUser);

router.use("/@me", meRouter);

export default router;
