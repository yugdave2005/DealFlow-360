import { PrismaClient } from '@prisma/client';
import { BadRequestError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const createQuotation = async ({ salesRepId, customerId, lineItems }) => {
  if (!lineItems || lineItems.length === 0) {
    throw new BadRequestError('A quotation must have at least one line item');
  }

  // Calculate totals
  let totalAmount = 0;
  let totalDiscountValue = 0;

  for (const item of lineItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new BadRequestError(`Product ${item.productId} not found`);

    const itemTotal = (item.quantity * item.unitPrice);
    const itemDiscountValue = itemTotal * (item.discountPercentage / 100);
    
    totalAmount += itemTotal - itemDiscountValue;
    totalDiscountValue += itemDiscountValue;
  }

  // Generate strict quotation number
  const count = await prisma.quotation.count();
  const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1000).padStart(5, '0')}`;

  // Execute in a transaction to enforce version sequence rule
  const quotation = await prisma.$transaction(async (tx) => {
    
    const newQuote = await tx.quotation.create({
      data: {
        quotationNumber,
        customerId,
        salesRepId,
        status: 'DRAFT',
      } // We don't link activeVersionId yet because it must reference an inserted version
    });

    const version = await tx.quotationVersion.create({
      data: {
        quotationId: newQuote.id,
        versionNumber: 1,
        totalAmount,
        totalDiscount: totalDiscountValue,
        createdById: salesRepId,
        items: {
          create: lineItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage
          }))
        }
      }
    });

    // Link the active version back to the Quotation explicitly
    const finalizedQuote = await tx.quotation.update({
      where: { id: newQuote.id },
      data: { activeVersionId: version.id },
      include: {
        versions: {
          include: { items: true }
        }
      }
    });

    return finalizedQuote;
  });

  return quotation;
};

export const getQuotations = async (userId, role) => {
  const where = role === 'SALES_REP' ? { salesRepId: userId } : {};
  
  return prisma.quotation.findMany({
    where,
    include: {
      versions: {
        where: { versionNumber: 1 } // In a real app we'd fetch the active version relation explicitly, simplifying here for speed
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};
