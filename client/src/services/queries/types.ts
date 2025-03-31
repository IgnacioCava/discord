import {
  Channel,
  ChannelMember,
  Message,
  Role,
  Room,
  RoomMember,
  User as PrismaUser,
} from "@prisma/client";
import { User } from "next-auth";

export interface RoomData extends Room {
  members: Array<RoomMember & { user: PrismaUser }>;
  roles: Role[];
  channels: ChannelData[];
}

export type ChannelData = Channel & {
  messages: Array<Message & { author: User }>;
  roles: Role[];
  members: Array<ChannelMember & { user: PrismaUser }>;
};
