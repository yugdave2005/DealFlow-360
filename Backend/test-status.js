import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const qs = await prisma.quotation.findMany({ select: { quotationNumber: true, status: true }});
  console.log(qs);
}
run();
