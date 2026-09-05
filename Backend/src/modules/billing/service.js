import * as repo from './repository.js';
import { validateCustomerId } from './validation.js';

const GST_RATE = 0.18;

/**
 * Comprehensive billing summary for a customer:
 * - Outstanding invoices
 * - Active subscriptions with next billing dates
 * - Payment history
 * - Total paid / total outstanding / tax breakdown
 */
export const getBillingSummary = async (customerId) => {
  validateCustomerId(customerId);

  const [invoices, subscriptions, payments] = await Promise.all([
    repo.findInvoicesByCustomer(customerId),
    repo.findSubscriptionsByCustomer(customerId),
    repo.findPaymentsByCustomer(customerId)
  ]);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.taxAmount || 0), 0);
  const outstanding = totalInvoiced - totalPaid;

  const overdueInvoices = invoices.filter(inv =>
    inv.status !== 'PAID' && new Date(inv.dueDate) < new Date()
  );

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');

  return {
    customerId,
    totalInvoiced,
    totalPaid,
    totalTax,
    outstanding,
    overdueCount: overdueInvoices.length,
    overdueAmount: overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    invoices,
    activeSubscriptions: activeSubscriptions.map(s => ({
      id: s.id,
      interval: s.interval,
      nextBillingDate: s.nextBillingDate,
      orderId: s.orderId
    })),
    payments,
    gstRate: GST_RATE
  };
};

/**
 * Calculate tax for a given subtotal.
 */
export const calculateTax = (subtotal) => ({
  subtotal: Number(subtotal),
  taxRate: GST_RATE,
  taxAmount: Number(subtotal) * GST_RATE,
  total: Number(subtotal) * (1 + GST_RATE)
});

/**
 * Prorate a subscription change.
 * E.g., switching from MONTHLY to QUARTERLY mid-cycle.
 */
export const calculateProration = (currentInterval, newInterval, daysRemaining, currentPrice) => {
  const intervalDays = { MONTHLY: 30, QUARTERLY: 90, YEARLY: 365 };
  const currentDays = intervalDays[currentInterval] || 30;
  const newDays = intervalDays[newInterval] || 30;

  const dailyRate = Number(currentPrice) / currentDays;
  const unusedCredit = dailyRate * daysRemaining;
  const newCycleCharge = (Number(currentPrice) / currentDays) * newDays;

  return {
    currentInterval,
    newInterval,
    daysRemaining,
    unusedCredit: Math.round(unusedCredit * 100) / 100,
    newCycleCharge: Math.round(newCycleCharge * 100) / 100,
    netCharge: Math.round((newCycleCharge - unusedCredit) * 100) / 100
  };
};
