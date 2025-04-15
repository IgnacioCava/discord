import { HTTPSServer } from "@socket/types";
import { Server } from "socket.io";
import { socketConfig } from "./socketConfig";

export const socketServer = (server: HTTPSServer) => {
  return new Server(server, socketConfig);
};
