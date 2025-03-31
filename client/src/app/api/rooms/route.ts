import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/rooms → Fetch all rooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        name: true,
        members: { where: { userId: session.user.id }, select: { id: true } },
      },
    });

    const roomsWithIsMember = rooms.map((room) => ({
      ...room,
      isMember: room.members.length > 0, // If the members array contains the user, they are a member
    }));

    return NextResponse.json(roomsWithIsMember, { status: 200 });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
