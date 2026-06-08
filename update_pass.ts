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
  const email = 'sauravshharma6@gmail.com'
  const password = 'admin'
  
  const user = await prisma.user.update({
    where: { email },
    data: { 
      password,
      role: 'OWNER'
    }
  })
  
  console.log('Updated user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
