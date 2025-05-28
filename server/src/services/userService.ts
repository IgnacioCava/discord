import prisma from "@prisma";

export const findUser = async (id: string) => {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    console.error("Database Error @findUser:", error);
    throw new Error(`Error while fetching user.`);
  }
};

export const findUserByName = async (username: string) => {
  try {
    return await prisma.user.findUnique({
      where: {
        name: username,
      },
    });
  } catch (error) {
    console.log("Database error @findUserByName");
    throw new Error("Failed to fetch user");
  }
};
