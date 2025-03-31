import { Io, SocketServer } from "@socket/types";

export const emitOnlyToUser = ({
  socket,
  room,
  event,
  payload,
}: {
  socket: SocketServer;
  room: string;
  event: string;
  payload: any;
}) => {
  socket.to(room).emit(event, payload);
};

export const emitToRoom = ({
  io,
  room,
  event,
  payload,
}: {
  io: Io;
  room: string;
  event: string;
  payload: any;
}) => {
  io.to(room).emit(event, payload);
};
