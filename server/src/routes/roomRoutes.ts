import express from "express";
import { authenticateUser } from "@middleware/auth";
import { createRoom, getRoomData, getRooms } from "@controllers/roomController";

const router = express.Router();

router.get("/", authenticateUser, getRooms);
router.get("/:roomId", authenticateUser, getRoomData);
router.post("/create", authenticateUser, createRoom);

export default router;
