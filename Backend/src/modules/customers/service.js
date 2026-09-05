import * as repo from './repository.js';

/**
 * Build commercial customer profiles with pipeline metrics.
 * Extracted from admin/controller.js getCustomers.
 */
export const listCustomers = async () => {
  const [customerUsers, quotations] = await Promise.all([
    repo.findAllCustomerUsers(),
    repo.findAllQuotations()
  ]);

  const customerList = customerUsers.map(user => {
    const userQuotes = quotations.filter(q => q.customerId === user.id);
    const pipelineValue = userQuotes.reduce((sum, q) => sum + Number(q.activeVersion?.totalAmount || 0), 0);
    const avgRisk = userQuotes.length > 0
      ? Math.round(userQuotes.reduce((sum, q) => sum + (q.activeVersion?.riskScore || 0), 0) / userQuotes.length)
      : 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      companyName: `${user.name} Corp`,
      tier: pipelineValue > 500000 ? 'ENTERPRISE' : pipelineValue > 100000 ? 'GOLD' : 'SILVER',
      contactName: user.name,
      activeQuotesCount: userQuotes.length,
      pipelineValue,
      lastActivity: userQuotes.length > 0 ? 'Active Deals' : 'Registered Account',
      riskScore: avgRisk,
      riskLevel: avgRisk > 60 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW',
      isActive: user.isActive,
      createdAt: user.createdAt
    };
  });

  // Fallback: tier-based samples if no customer users exist yet
  if (customerList.length === 0) {
    const tiers = await repo.findAllTiers();
    for (const tier of tiers) {
      customerList.push({
        id: tier.id,
        name: tier.name,
        email: `contact@${tier.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        companyName: `${tier.name} Corporation`,
        tier: tier.name.toUpperCase().includes('ENTERPRISE') ? 'ENTERPRISE' : tier.name.toUpperCase().includes('GOLD') ? 'GOLD' : 'SILVER',
        contactName: tier.description || 'Account Representative',
        activeQuotesCount: 0, pipelineValue: 0, lastActivity: 'Tier Account',
        riskScore: 0, riskLevel: 'LOW', isActive: true, createdAt: new Date().toISOString()
      });
    }
  }

  return customerList;
};
