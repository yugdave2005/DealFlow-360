import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Clearing database (except users)...');
  
  try {
    // Delete in reverse order of dependencies
    await prisma.outboxEvent.deleteMany({});
    await prisma.auditLog.deleteMany({});
    
    await prisma.subscription.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.orderItem.deleteMany({});
    
    await prisma.fulfillmentItem.deleteMany({});
    await prisma.fulfillmentPlan.deleteMany({});
    await prisma.order.deleteMany({});
    
    await prisma.inventory.deleteMany({});
    await prisma.warehouse.deleteMany({});
    
    await prisma.negotiationMessage.deleteMany({});
    await prisma.approvalRequest.deleteMany({});
    await prisma.quotationItem.deleteMany({});
    await prisma.quotationVersion.deleteMany({});
    await prisma.quotation.deleteMany({});
    
    await prisma.productPricing.deleteMany({});
    await prisma.product.deleteMany({});
    
    await prisma.discountRule.deleteMany({});
    await prisma.customerTier.deleteMany({});
    await prisma.approvalRule.deleteMany({});
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
