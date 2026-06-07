import { PrismaClient } from "./src/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.POSTGRES_PRISMA_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'sauravsah491@gmail.com'
  const password = 'Incorrect@123###'
  
  const user = await prisma.user.update({
    where: { email },
    data: { password }
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
