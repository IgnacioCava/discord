import prisma from "@prisma";

export const findUser = async (id: string) => {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    console.error("Database Error @findUser:", error);
    throw new Error(`Error while fetching user.`);
  }
};
