import express from "express";
import { getMessages } from "@controllers/messageController";
import { authenticateUser } from "@middleware/auth";

const router = express.Router();

router.get("/:roomId/messages", authenticateUser, getMessages);

export default router;
