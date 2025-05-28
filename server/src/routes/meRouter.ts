// routes/meRouter.ts
import express from "express";
import { authenticateUser } from "@middleware/auth";
import {
  getFriendList,
  sendFriendRequest,
  answerFriendRequest,
  cancelFriendRequest,
} from "@controllers/userRelationshipController";

const meRouter = express.Router();

meRouter.get("/relationships", getFriendList);
meRouter.post("/relationships", sendFriendRequest);
meRouter.put("/relationships/:senderId", answerFriendRequest)
meRouter.delete("/relationships/:receiverId", cancelFriendRequest);

export default meRouter;
