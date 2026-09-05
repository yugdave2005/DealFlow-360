import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.product.create({ 
    data: { 
      name: 'Super Laptop', 
      category: 'Hardware', 
      pricing: { create: { price: 1500 } } 
    } 
  });
  
  await prisma.customer.create({
    data: {
       id: 'bb222222-2222-2222-2222-222222222222',
       name: 'Acme Mock Customer',
       email: 'acme@mock.com',
       phone: '1234567890',
       type: 'B2B',
       status: 'ACTIVE'
    }
  })
  console.log('Seeded product and customer');
}
main().catch(console.error).finally(() => prisma.$disconnect());
