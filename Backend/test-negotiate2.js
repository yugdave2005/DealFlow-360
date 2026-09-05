import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const quotationId = "359731f3-5b92-426c-8219-6b84dca1f12e";
  try {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId },
      include: { 
        versions: { 
          orderBy: { versionNumber: 'desc' }, 
          take: 1,
          include: { items: true }
        } 
      }
    });
    
    const activeVersion = quotation.versions[0];
    const newVersionNumber = (activeVersion?.versionNumber || 1) + 1;
    const discountPct = 20;

    let totalAmount = 0;
    let totalDiscountValue = 0;
    for (const item of (activeVersion?.items || [])) {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      const disc = lineTotal * (discountPct / 100);
      totalAmount += lineTotal - disc;
      totalDiscountValue += disc;
    }
    
    const salesRepExists = await prisma.user.findUnique({
      where: { id: quotation.salesRepId }
    });

    const newVersion = await prisma.quotationVersion.create({
      data: {
        quotationId,
        versionNumber: newVersionNumber,
        totalAmount,
        totalDiscount: totalDiscountValue,
        riskScore: activeVersion ? Math.min(100, (activeVersion.riskScore || 25) + 15) : 40,
        internalNotes: `Customer counter-offer: ${discountPct}% discount requested.`,
        createdById: salesRepExists ? quotation.salesRepId : null,
        items: {
          create: (activeVersion?.items || []).map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountPercentage: discountPct
          }))
        }
      }
    });
    
    console.log("Success! Version ID:", newVersion.id);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
