import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Weighted Blended Risk Score Formula:
 * 
 * For each line item:
 *   lineRisk = (discountPercentage / maxAllowedDiscount) * 100
 * 
 * Overall:
 *   weightedRisk = SUM(lineRisk * lineValue) / SUM(lineValue)
 *   marginImpact = totalDiscount / totalAmount * 100
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

  // Fetch applicable discount rules for comparison
  const discountRules = await prisma.discountRule.findMany();

  let totalWeightedRisk = 0;
  let totalLineValue = 0;

  for (const item of version.items) {
    const lineValue = Number(item.quantity) * Number(item.unitPrice);
    const discPct = Number(item.discountPercentage);

    // Find the maximum allowed discount for this product category or tier
    // Default to 30% if no rule exists
    let maxAllowed = 30;
    if (discountRules.length > 0) {
      const applicableRule = discountRules.find(r => r.appliedTo === 'CATEGORY');
      if (applicableRule) {
        maxAllowed = Number(applicableRule.maxDiscountPercentage);
      }
    }

    const lineRisk = maxAllowed > 0 ? (discPct / maxAllowed) * 100 : 0;
    totalWeightedRisk += lineRisk * lineValue;
    totalLineValue += lineValue;
  }

  const weightedRisk = totalLineValue > 0 ? totalWeightedRisk / totalLineValue : 0;
  const totalAmount = Number(version.totalAmount) + Number(version.totalDiscount);
  const marginImpact = totalAmount > 0 ? (Number(version.totalDiscount) / totalAmount) * 100 : 0;

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
