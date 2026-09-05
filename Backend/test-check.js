import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const quotation = await prisma.quotation.findFirst({
    where: { id: "359731f3-5b92-426c-8219-6b84dca1f12e" }
  });
  console.log("Quotation:", quotation);
}
test();
