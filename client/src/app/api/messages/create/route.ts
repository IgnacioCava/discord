// app/api/messages/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Import your auth options (or update accordingly)
import socket from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, content } = await req.json();

    if (!roomId || !content) {
      return NextResponse.json(
        { error: "Room ID and content are required" },
        { status: 400 }
      );
    }

    // Check if the user is a member of the room
    const roomMember = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: roomId,
          userId: session.user.id,
        },
      },
    });

    if (!roomMember) {
      return NextResponse.json(
        { error: "You are not a member of this room" },
        { status: 403 }
      );
    }

    // Create the new message
    const message = await prisma.message.create({
      data: {
        content,
        authorId: session.user.id,
        roomId,
      },
    });

    // Optionally, emit a socket event to notify others
    // socket.to(roomId).emit("new-message", message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}