import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const isValidObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// GET /api/rooms/:id → Fetch room by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id)
    return NextResponse.json(
      { error: "No room id was provided" },
      { status: 500 }
    );

  try {
    const isValid = isValidObjectId(id);
    if (!isValid)
      return NextResponse.json({ error: "Invalid ID format" }, { status: 500 });

    const room = await prisma.room.findUnique({ where: { id }, include: {members: {orderBy: [{isOnline: 'desc'}, {joinedAt: 'desc'}]}} });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}
