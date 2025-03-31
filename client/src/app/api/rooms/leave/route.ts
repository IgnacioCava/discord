import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Import your auth options (or update accordingly)

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await req.json();

    // Ensure the roomId is provided
    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
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
      return NextResponse.json({ error: "User is not a member of this room" }, { status: 404 });
    }

    // Remove the user from the room
    await prisma.roomMember.delete({
      where: {
        id: roomMember.id,
      },
    });

    // Optionally, emit a socket event to notify other users in the room
    // socket.to(roomId).emit("user-left", { userId: session.user.id });

    return NextResponse.json({ message: "Successfully left the room" }, { status: 200 });
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 });
  }
}