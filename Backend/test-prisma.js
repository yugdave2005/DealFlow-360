import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const run = async () => {
   try {
     const p = await prisma.product.findFirst();
     console.log('Product ID:', p.id);
     
     const newQuote = await prisma.quotation.create({
       data: {
         quotationNumber: 'QT-TEST-1234',
         customerId: 'bb222222-2222-2222-2222-222222222222',
         salesRepId: 'sales-rep-id-123',
         status: 'DRAFT',
       }
     });
     console.log('Quote inserted!', newQuote);

     const version = await prisma.quotationVersion.create({
        data: {
          quotationId: newQuote.id,
          versionNumber: 1,
          totalAmount: 5000,
          totalDiscount: 100,
          createdById: 'sales-rep-id-123',
          items: {
            create: [{
              productId: p.id,
              quantity: 2,
              unitPrice: 2500,
              discountPercentage: 2
            }]
          }
        }
      });
      console.log('Version inserted!', version);

   } catch (err) {
     console.error('Prisma Error Triggered:', err);
   } finally {
     await prisma.$disconnect();
   }
}
run();
