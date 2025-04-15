import { authenticateSocket } from "../middleware/auth";
import http from "http";
import { Server } from "socket.io";
import { setupMessageSocket } from "@socket/events/message";
import { HTTPSServer } from "./types";
import { setupRoomSocket } from "@socket/events/room";
import { findUser } from "@services/userService";
import { addUserDataToSocket } from "@controllers/userController";
import { setupChannelSocket } from "@socket/events/channel";
import { setupUserSocket } from "@socket/events/user";
import redis from "@lib/redis";
import { setupVoiceSocket } from "./events/voice";
import { setupTransportTest } from "./events/transportTest";
import { setupTransportTest2 } from "./events/transportTest2";
import { socketServer } from "@lib/socket.io/socketService";
import { transportImport } from "./events/transportImport";

const initSocket = (server: HTTPSServer) => {
  const io = socketServer(server);

  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    try {
      //socket.on('join-voice-channel', console.log)
      await addUserDataToSocket(socket);
      await setupUserSocket(io, socket);

      setupRoomSocket(io, socket);
      setupMessageSocket(io, socket);
      setupChannelSocket(io, socket);
      setupVoiceSocket(io, socket);
      // setupTransportTest(io, socket);
      //setupTransportTest2(io, socket);

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
  const sfu = io.of("/sfu");

  sfu.use(authenticateSocket);

  sfu.on("connection", async (socket) => {
    console.log(`Client connected to /sfu namespace: ${socket.id}`);

    try {
      await addUserDataToSocket(socket); // Optional, if needed
      //await setupUserSocket(io, socket);
      await transportImport(sfu, socket);
      //await setupTransportTest2(sfu, socket);
    } catch (err) {
      console.error("Error in /sfu connection:", err);
      socket.disconnect();
    }
  });

  return io;
};

export default initSocket;
