import express from "express";
import { authenticateUser } from "@middleware/auth";
import { createRoom, getRoomData, getRooms } from "@controllers/roomController";
import { createChannel } from "@controllers/channelController";

const router = express.Router();

router.post("/create", authenticateUser, createChannel);

export default router;
