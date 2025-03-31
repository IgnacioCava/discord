import { authenticateSocket } from "../middleware/auth";
import http from "http";
import { Server } from "socket.io";
import { setupMessageSocket } from "@socket/events/message";
import { HTTPServer } from "./types";
import { setupRoomSocket } from "@socket/events/room";
import { findUser } from "@services/userService";
import { addUserDataToSocket } from "@controllers/userController";
import { setupChannelSocket } from "@socket/events/channel";
import { setupUserSocket } from "@socket/events/user";
import redis from "@lib/redis";
import { setupVoiceSocket } from "./events/voice";

const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {},
    pingTimeout: 5000,
  });

  //let router: Router;

  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    try {
      //socket.on('join-voice-channel', console.log)
      await addUserDataToSocket(socket);
      await setupUserSocket(io, socket);
      
      setupRoomSocket(io, socket);
      setupMessageSocket(io, socket);
      setupChannelSocket(io, socket);
      setupVoiceSocket(io, socket)
      

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        // socket.userDB = null;
        // socket.user = null;
        socket.handshake.auth.token = null;
      });
    } catch (error) {
      console.error("Error during connection:", error);
      socket.disconnect(); // Disconnect if there's an error during user lookup
    }
  });

  return io;
};

export default initSocket;
