import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
