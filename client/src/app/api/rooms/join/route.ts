import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId } = body; // Get the roomId and userId from the request body
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session?.user?.id

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID and User ID are required" },
        { status: 400 }
      );
    }

    // Fetch the room to verify it exists
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Ensure the user is not already a member of the room
    const existingMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of the room" },
        { status: 400 }
      );
    }

    // Add the user to the room
    await prisma.roomMember.create({
      data: {
        roomId,
        userId,
        isOnline: true, // You can change this based on your use case
      },
    });

    //socket.to(roomId).emit("user-joined", { userId });

    return NextResponse.json(
      { message: "User successfully joined the room" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
