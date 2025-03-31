import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "testuser@example.com"
    }
  });

  const room = await prisma.room.create({
    data: {
      name: "General",
      members: {
        create: {
          userId: user.id,
          isOnline: true
        }
      }
    }
  });

  console.log({ user, room });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());