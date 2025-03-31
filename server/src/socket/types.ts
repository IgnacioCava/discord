import { DefaultEventsMap, Server, Socket } from "socket.io";
import http from "http";

export type HTTPServer = http.Server<
  typeof http.IncomingMessage,
  typeof http.ServerResponse
>;

export type Io = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

export type SocketServer = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

export interface MessageData {
  content: string;
  channelId: string;
  authorId: string;
  tempId: string;
}

export interface EditMessageData {
  content: string;
  prevContent: string;
  channelId: string;
  authorId: string;
  id: string;
}