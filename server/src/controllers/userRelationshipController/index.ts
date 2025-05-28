import prisma from "@prisma";
import type { FriendshipStatus, UserRelationship } from "@prisma/client";
import {
  blockedRelationExists,
  checkIfRequestExists,
  deleteFriendRequest,
  findFriendRequests,
  updateFriendRequest,
} from "@services/userRelationshipServices";
import { findUserByName } from "@services/userService";
import { SocketServer } from "@socket/types";
import { Request, Response } from "express";
import { Socket } from "socket.io";

export const getFriendList = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) throw { error: "Unauthorized", status: 401 };
    const friendRequests = await findFriendRequests(userId);
    const friendListByStatus = friendRequests.reduce(
      (acc: Record<FriendshipStatus, typeof friendRequests>, relationship) => {
        // Initialize an array for the status if it doesn't exist
        if (!acc[relationship.status]) {
          acc[relationship.status] = [];
        }

        // Push the current relationship into the correct status array
        acc[relationship.status].push(relationship);
        return acc;
      },
      {} as Record<FriendshipStatus, typeof friendRequests>
    );
    res.status(200).json(friendListByStatus);
  } catch (error: any) {
    console.log("Error @getFriendList:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  const { username } = req.body;
  const userId = req.user?.id;
  //     res.status(200).json("Request sent");
  try {
    if (!userId) throw { message: "Unauthorized", status: 401 };
    if (!username) throw { message: "Username field required", status: 400 };
    const friendRequest = await prisma.$transaction(async (prisma) => {
      const receiver = await findUserByName(username);

      if (!receiver) throw { message: "User not found", status: 404 };
      const receiverId = receiver.id;

      const request = await checkIfRequestExists(userId, receiverId);
      if (request?.status === "BLOCKED")
        throw {
          message:
            "Can't send friend request because you were blocked by this user",
          status: 403,
        };
      if (request)
        throw { message: "Friend request already exists", status: 409 };

      const newRequest = await prisma.userRelationship.upsert({
        where: {
          senderId_receiverId: {
            senderId: userId,
            receiverId,
          },
        },
        update: {
          status: "PENDING",
        },
        create: {
          status: "PENDING",
          senderId: userId,
          receiverId,
        },
      });
      return newRequest;
    });
    res.status(201).json(friendRequest);
  } catch (error: any) {
    console.log("Error @sendFriendRequest:", error);
    res
      .status(error.status)
      .json({ error: error.message || "Internal server error" });
  }
};

export const answerFriendRequest = async (req: Request, res: Response) => {
  const { accepted } = req.body;
  const { senderId } = req.params;
  const receiverId = req.user?.id;
  console.log({ senderId });
  try {
    if (accepted === undefined)
      throw { status: 400, message: "'accepted' field required" };
    if (typeof accepted !== "boolean")
      throw {
        status: 400,
        message: "'accepted' must be boolean",
      };
    const blockCheck = await blockedRelationExists(senderId, receiverId);
    if (blockCheck) {
      let message = "";
      if (blockCheck.receiverId === receiverId)
        message =
          "You have blocked this user. You cannot accept or send friend requests.";
      else
        message =
          "You are blocked by this user. You cannot accept or send friend requests.";
      throw { error: message, status: 403 };
    }
    await updateFriendRequest(senderId, receiverId, accepted);
    res.sendStatus(204);
  } catch (error: any) {
    console.log("Error @answerFriendRequest:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const cancelFriendRequest = async (req: Request, res: Response) => {
  const { receiverId } = req.params;
  console.log(req.params);
  const userId = req.user?.id;
  try {
    if (!userId) throw { message: "Unauthorized", status: 401 };
    if (!receiverId)
      throw { message: "receiverId field required", status: 400 };

    await deleteFriendRequest(userId, receiverId);
    res.sendStatus(204);
  } catch (error: any) {
    console.log("Error @cancelFriendRequest:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error" });
  }
};
