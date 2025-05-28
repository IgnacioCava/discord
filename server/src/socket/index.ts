import { addUserDataToSocket } from "@controllers/userController";
import { initPubSubService } from "@lib/socket.io/pubsubService";
import { socketServer } from "@lib/socket.io/socketService";
import { setupChannelSocket } from "@socket/events/channel";
import { setupMessageSocket } from "@socket/events/message";
import { setupRoomSocket } from "@socket/events/room";
import { setupUserSocket } from "@socket/events/user";
import { authenticateSocket } from "../middleware/auth";
import { transportImport } from "./events/transportImport";
import { setupVoiceSocket } from "./events/voice";
import { HTTPSServer } from "./types";
import { setupWorker } from "@socket.io/sticky";

const initSocket = async (server: HTTPSServer) => {
  const io = socketServer(server);
  initPubSubService(io);

  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    try {
      console.log(`Connected to ${process.pid}:${process.env.WORKER_PORT}`);
      //socket.on('join-voice-channel', console.log)
      await addUserDataToSocket(socket);
      await setupUserSocket(io, socket);

      setupRoomSocket(io, socket);
      setupMessageSocket(io, socket);
      setupChannelSocket(io, socket);
      setupVoiceSocket(io, socket);

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id} from ${process.pid}`);
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
  //setupWorker(io);
  return io;
};

export default initSocket;
