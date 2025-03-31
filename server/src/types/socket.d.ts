import { User } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';

declare module 'socket.io' {
  interface Socket {
    user?: JwtPayload | null;
    userDB?: User | null
  }
}