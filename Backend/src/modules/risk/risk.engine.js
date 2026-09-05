import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Weighted Blended Risk Score Formula:
 * 
 * For each line item:
 *   1. Look up the product to get its category
 *   2. Find the matching DiscountRule for that category
 *   3. lineRisk = (discountPercentage / maxAllowedDiscount) * 100
 * 
 * Overall:
 *   weightedRisk = SUM(lineRisk * lineValue) / SUM(lineValue)
 *   marginImpact = totalDiscount / grossTotal * 100
 *   finalScore = round(0.6 * weightedRisk + 0.4 * marginImpact)
 * 
 * Score 0-30: LOW risk (auto-approve)
 * Score 31-60: MEDIUM risk (Sales Manager approval)
 * Score 61-100: HIGH risk (Admin/Finance approval)
 */
export const calculateRiskScore = async (versionId) => {
  const version = await prisma.quotationVersion.findUnique({
    where: { id: versionId },
    include: { items: true }
  });

  if (!version || version.items.length === 0) return 0;

  // Fetch all discount rules and products needed
  const discountRules = await prisma.discountRule.findMany();
  const productIds = version.items.map(it => it.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  let totalWeightedRisk = 0;
  let totalLineValue = 0;

  for (const item of version.items) {
    const lineValue = Number(item.quantity) * Number(item.unitPrice);
    const discPct = Number(item.discountPercentage);

    // Find product to determine category
    const product = productMap.get(item.productId);
    const category = product?.category || 'HARDWARE';

    // Find the matching discount rule for this category
    let maxAllowed = 30; // Default fallback
    
    // First try category-specific rule
    const categoryRule = discountRules.find(
      r => r.appliedTo === 'CATEGORY' && 
           r.productCategory?.toUpperCase() === category.toUpperCase()
    );
    if (categoryRule) {
      maxAllowed = Number(categoryRule.maxDiscountPercentage);
    }

    // Calculate line risk: how much of the allowed discount is being used
    const lineRisk = maxAllowed > 0 ? (discPct / maxAllowed) * 100 : 0;
    totalWeightedRisk += lineRisk * lineValue;
    totalLineValue += lineValue;
  }

  const weightedRisk = totalLineValue > 0 ? totalWeightedRisk / totalLineValue : 0;
  
  // Margin impact: what percentage of gross total is given as discount
  const grossTotal = Number(version.totalAmount) + Number(version.totalDiscount);
  const marginImpact = grossTotal > 0 ? (Number(version.totalDiscount) / grossTotal) * 100 : 0;

  const finalScore = Math.round(0.6 * weightedRisk + 0.4 * marginImpact);
  const clampedScore = Math.min(100, Math.max(0, finalScore));

  // Persist the score
  await prisma.quotationVersion.update({
    where: { id: versionId },
    data: { riskScore: clampedScore }
  });

  return clampedScore;
};

export const getRiskLevel = (score) => {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
};
