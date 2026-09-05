import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.quotation.findFirst({ where: { id: "QT-2026-1005" }});
    console.log("No error for string format");
  } catch(e) {
    console.error("Error for string format:", e.message);
  }
}
test();
