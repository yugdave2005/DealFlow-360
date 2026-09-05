import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const quotes = await prisma.quotation.findMany({ select: { id: true, quotationNumber: true }});
  console.log('Available Quotations:');
  console.dir(quotes);

  const targetId = 'db7d1c61-a9a0-481d-acb0-d0d175f631c3';
  const target = await prisma.quotation.findUnique({ where: { id: targetId }});
  console.log('Target Quotation:', target);
}

main().catch(console.error).finally(() => prisma.$disconnect());
