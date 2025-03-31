import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // const room = await prisma.room.create({
    //   data: {
    //     name,
    //     members: {
    //       create: {
    //         userId: session.user.id, // Automatically add the user as a RoomMember
    //         //role: "ADMIN", // The creator can be assigned as ADMIN by default
    //         isOnline: true, // Mark them online at creation
    //       },
    //     },
    //   },
    // });

    //socket.emit("create-room", room.id); // Emit event to server

    return NextResponse.json({}, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
