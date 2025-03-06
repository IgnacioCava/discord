"use server";

import prisma from "@/lib/prisma";
import { User } from "@prisma/client";

type CreateUserArgs = Pick<User, "email" | "name">;
type UpdateUserArgs = User;
type DeleteUserArgs = User;

export const createUser = async (user: CreateUserArgs) => {
  return await prisma.user.create({
    data: user,
  });
};

export const updateUser = async (user: UpdateUserArgs) => {
  const { id, ...userData } = user;
  return await prisma.user.update({
    where: {
      id,
    },
    data: userData,
  });
};

export const deleteUser = async (user: DeleteUserArgs) => {
  return await prisma.user.delete({
    where: {
      id: user.id,
    },
    select: {
      id: true,
    },
  });
};
