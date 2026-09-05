export const determineApprovalRequirement = async (prisma, riskScore) => {
  // Fetch rules sorted by priority (highest priority first)
  const rules = await prisma.approvalRule.findMany({
    orderBy: { priority: 'desc' }
  });

  // Find the highest priority rule that matches the risk score
  const matchedRule = rules.find(
    r => riskScore >= r.minRiskScore && riskScore <= r.maxRiskScore
  );

  // If a rule matches and it requires a role higher than SALES_REP, approval is required
  if (matchedRule && matchedRule.requiredApproverLevel !== 'SALES_REP') {
    return { required: true, role: matchedRule.requiredApproverLevel };
  }

  // Otherwise, no approval is required (or it's just self-approval)
  return { required: false, role: null };
};
