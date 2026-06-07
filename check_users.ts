import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.POSTGRES_PRISMA_URL;

const createPrismaClient = () => {
  if (connectionString) {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
};

const prisma = createPrismaClient();

async function main() {
  const users = await prisma.user.findMany()
  console.log('Users in database:', JSON.stringify(users, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
