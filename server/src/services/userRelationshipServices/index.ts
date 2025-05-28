import prisma from "@prisma";
import { FriendshipStatus } from "@prisma/client";

export const findFriendRequests = async (userId: string) => {
  try {
    const friendRequests = await prisma.userRelationship.findMany({
      where: {
        AND: [
          {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: { notIn: ["DECLINED", "BLOCKED"] },
          },
        ],
      },
      orderBy: { status: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            isOnline: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            isOnline: true,
          },
        },
      },
    });
    // We don't know if the current user is the userRelationship's sender or receiver, so we map them accordingly
    const friends = friendRequests.map(
      ({ status, senderId, sender, receiver }) => {
        const isSender = senderId === userId;
        const { isOnline: isSenderOnline, ...senderFields } = sender;
        const { isOnline: isReceiverOnline, ...receiverFields } = receiver;

        return {
          status,
          isSender,
          ...(isSender ? receiverFields : senderFields),
          ...(status === "ACCEPTED"
            ? isSender
              ? { isOnline: isSenderOnline }
              : { isOnline: isReceiverOnline }
            : {}),
        };
        ///return isSender ? rel.receiver : rel.sender;
      }
    );
    return friends;
  } catch (error) {
    console.log("Database error @findFriendRequests", error);
    throw new Error("Failed to fetch userRelationships");
  }
};

export const checkIfRequestExists = async (
  senderId: string,
  receiverId: string
) => {
  try {
    // If the friend request gets declined, the sender should be able to send a new one,
    // so we ignore declined requests
    return await prisma.userRelationship.findFirst({
      where: {
        AND: [
          {
            OR: [
              {
                senderId,
                receiverId,
              },
              {
                senderId: receiverId,
                receiverId: senderId,
              },
            ],
          },
          { status: { not: "DECLINED" } },
        ],
      },
    });
  } catch (error) {
    console.log("Database error @checkIfRequestExists", error);
    throw new Error("Failed to check relation");
  }
};

export const blockedRelationExists = async (
  senderId: string,
  receiverId: string
) => {
  try {
    const blockCheck = await prisma.userRelationship.findFirst({
      where: {
        AND: [
          {
            OR: [
              {
                senderId: senderId,
                receiverId: receiverId,
              },
              {
                senderId: receiverId,
                receiverId: senderId,
              },
            ],
          },
          { status: "BLOCKED" },
        ],
      },
    });
    return blockCheck;
  } catch (error) {
    console.log("Database error @blockedRelationExists", error);
    throw new Error("Failed to check relation");
  }
};

export const deleteFriendRequest = async (
  senderId: string,
  receiverId: string
) => {
  try {
    await prisma.userRelationship.delete({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId,
        },
      },
    });
  } catch (error) {
    console.log("Database error @deleteUserRelationship", error);
    throw new Error("Failed to delete relation");
  }
};

export const updateFriendRequest = async (
  senderId: string,
  receiverId: string,
  accepted: boolean
) => {
  try {
    await prisma.userRelationship.update({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId,
        },
      },
      data: {
        status: accepted ? "ACCEPTED" : "DECLINED",
      },
    });
  } catch (error) {
    console.log("Database error @updateFriendRequest", error);
    throw new Error("Failed to update relation");
  }
};
