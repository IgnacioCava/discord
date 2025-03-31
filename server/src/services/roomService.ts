import prisma from "@prisma";

export const findRoomById = async (roomId: string) => {
  try {
    return await prisma.room.findUnique({ where: { id: roomId } });
  } catch (error) {
    console.error("Database Error @findRoomById:", error);
    throw new Error("Failed to find room");
  }
};

export const findRooms = async (userId: string) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        members: {
          where: { userId },
          select: { id: true }, // Checks if the user is a member
        },
      },
    });

    return rooms.map((room) => ({
      ...room,
      isMember: room.members.length > 0, // True if user is found in members
    }));
  } catch (error) {
    console.error("Database Error @findRooms:", error);
    throw new Error("Failed to find rooms");
  }
};

export const createNewRoom = async (name: string, userId: string) => {
  try {
    // Create Room
    const result = await prisma.$transaction(async (prisma) => {
      const room = await prisma.room.create({
        data: { name: name },
      });

      // Create Channel for the Room
      const channel = await prisma.channel.create({
        data: {
          name: "general",
          roomId: room.id,
          type: "TEXT"
        },
      });

      const voiceChannel = await prisma.channel.create({
        data: {
          name: "General",
          roomId: room.id,
          type: "VOICE"
        },
      });

      // Create RoomMember for the user
      await prisma.roomMember.create({
        data: {
          userId: userId,
          roomId: room.id,
          permissions: 16, // Admin permissions
        },
      });

      // Create ChannelMember for the user
      await prisma.channelMember.create({
        data: {
          userId: userId,
          channelId: channel.id,
          permissions: 16, // Admin permissions
        },
      });

      await prisma.channelMember.create({
        data: {
          userId: userId,
          channelId: voiceChannel.id,
          permissions: 16, // Admin permissions
        },
      });

      return { room, channel };
    });

    return result;
  } catch (error) {
    console.error("Database Error @createNewRoom:", error);
    throw new Error("Failed to create room");
  }
};

export const fetchRoomData = async (roomId: string) => {
  try {
    const roomData = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
      include: {
        // Fetch room members
        members: {
          include: {
            user: true, // Include user data for the member
            role: true, // Include role data (if available)
          },
        },
        // Fetch all channels related to the room
        channels: {
          include: {
            messages: {
              include: {
                author: true,
              }
            },
            roles: true,
            members: {
              include: {
                user: true, // Include user data for the channel member
                role: true, // Include role data for the channel member
              },
            },
          },
        },
        roles: true,
      },
    });

    return roomData;
  } catch (error) {
    console.error("Database Error @fetchRoomData:", error);
    throw new Error("Failed to fetch room data from the database.");
  }
};

export const joinRoom = async () => {};
export const leaveRoom = async () => {};
