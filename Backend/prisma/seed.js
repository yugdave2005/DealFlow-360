import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DealFlow360 Database Seeding...');

  // Reset existing data
  await prisma.auditLog.deleteMany({});
  await prisma.negotiationMessage.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotationVersion.deleteMany({});
  await prisma.quotation.deleteMany({});
  
  await prisma.fulfillmentItem.deleteMany({});
  await prisma.fulfillmentPlan.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  
  await prisma.inventory.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.productPricing.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.discountRule.deleteMany({});
  await prisma.customerTier.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleared existing data');

  // ==========================================
  // USERS
  // ==========================================
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({ data: { name: 'Admin Operations', email: 'admin@dealflow360.com', passwordHash, role: 'ADMIN' } });
  const vpSales = await prisma.user.create({ data: { name: 'Tony Stark', email: 'vp@dealflow360.com', passwordHash, role: 'ADMIN' } });
  const manager = await prisma.user.create({ data: { name: 'Sarah Connor', email: 'manager@dealflow360.com', passwordHash, role: 'SALES_MANAGER' } });
  const rep1 = await prisma.user.create({ data: { name: 'James Halpert', email: 'sales1@dealflow360.com', passwordHash, role: 'SALES_REP' } });
  const finance = await prisma.user.create({ data: { name: 'Oscar Martinez', email: 'finance@dealflow360.com', passwordHash, role: 'FINANCE' } });
  
  // Customers
  const custAcme = await prisma.user.create({ data: { name: 'Acme Corporation', email: 'acme@client.com', passwordHash, role: 'CUSTOMER' } });
  const custStark = await prisma.user.create({ data: { name: 'Stark Industries', email: 'stark@client.com', passwordHash, role: 'CUSTOMER' } });
  const custGlobal = await prisma.user.create({ data: { name: 'Global Net Solutions', email: 'global@client.com', passwordHash, role: 'CUSTOMER' } });

  // ==========================================
  // REGIONS & TIERS
  // ==========================================
  const tierEnterprise = await prisma.customerTier.create({ data: { name: 'ENTERPRISE', description: 'Fortune 500 equivalent tier' } });
  const tierMidMarket = await prisma.customerTier.create({ data: { name: 'MID_MARKET', description: 'Medium business tier' } });

  // ==========================================
  // WAREHOUSES
  // ==========================================
  const whAhmd = await prisma.warehouse.create({ data: { name: 'Ahmedabad Central Hub', code: 'W-AHM-01', location: 'Ahmedabad' } });
  const whAnnd = await prisma.warehouse.create({ data: { name: 'Anand Regional Depot', code: 'W-AND-01', location: 'Anand' } });

  // ==========================================
  // PRODUCTS & INVENTORY
  // ==========================================
  const prodFirewall = await prisma.product.create({
    data: {
      name: 'Enterprise Firewall Appliance X-500', category: 'HARDWARE', quantityOnHand: 55,
      pricing: { create: [
        { customerTierId: tierEnterprise.id, price: 4200.00 },
        { customerTierId: tierMidMarket.id, price: 4800.00 }
      ]},
      inventory: { create: [
        { warehouseId: whAhmd.id, availableQuantity: 40 },
        { warehouseId: whAnnd.id, availableQuantity: 15 }
      ]}
    }
  });

  const prodMigration = await prisma.product.create({
    data: {
      name: 'Oracle to PostgreSQL Migration Service', category: 'SERVICES', quantityOnHand: 9999,
      pricing: { create: [ { customerTierId: tierEnterprise.id, price: 125000.00 } ] }
    }
  });

  const prodSub = await prisma.product.create({
    data: {
      name: 'Managed Cloud Security Endpoint (SaaS)', category: 'SUBSCRIPTION', isSubscription: true, recurringInterval: 'MONTHLY', quantityOnHand: 9999,
      pricing: { create: [
        { customerTierId: tierEnterprise.id, price: 35.00 },
        { customerTierId: tierMidMarket.id, price: 45.00 }
      ]}
    }
  });

  // ==========================================
  // QUOTATIONS
  // ==========================================
  console.log('Generating structured quotations for pipeline visibility...');

  // 1. Pending Approval Quotation
  const quote1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1042',
      customerId: custAcme.id,
      salesRepId: rep1.id,
      status: 'PENDING_APPROVAL',
      versions: {
        create: [{
          versionNumber: 1, createdById: rep1.id, totalAmount: 450000.00, totalDiscount: 67500.00, riskScore: 68,
          items: { create: [ { productId: prodFirewall.id, quantity: 100, unitPrice: 4800.00, discountPercentage: 15.00 } ] },
          approvals: { create: [ { assignedRole: 'SALES_MANAGER', status: 'PENDING', comments: '15% discount needs manager sign-off.' } ] }
        }]
      }
    },
    include: { versions: true }
  });
  await prisma.quotation.update({ where: { id: quote1.id }, data: { activeVersionId: quote1.versions[0].id } });

  // 2. Draft Quotation (Stalled)
  const quote2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1043', customerId: custGlobal.id, salesRepId: manager.id, status: 'DRAFT',
      versions: {
        create: [{
          versionNumber: 1, createdById: manager.id, totalAmount: 18000.00, totalDiscount: 0, riskScore: 10,
          items: { create: [ { productId: prodSub.id, quantity: 500, unitPrice: 36.00, discountPercentage: 0 } ] }
        }]
      }
    },
    include: { versions: true }
  });
  await prisma.quotation.update({ where: { id: quote2.id }, data: { activeVersionId: quote2.versions[0].id } });

  // 3. Sent to Customer / Waiting response
  const quote3 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1044', customerId: custStark.id, salesRepId: vpSales.id, status: 'SENT',
      versions: {
        create: [{
          versionNumber: 1, createdById: vpSales.id, totalAmount: 125000.00, totalDiscount: 10000.00, riskScore: 35,
          items: { create: [ { productId: prodMigration.id, quantity: 1, unitPrice: 135000.00, discountPercentage: 7.4 } ] }
        }]
      }
    },
    include: { versions: true }
  });
  await prisma.quotation.update({ where: { id: quote3.id }, data: { activeVersionId: quote3.versions[0].id } });

  // ==========================================
  // CONFIRMED DEALS -> FULFILLMENT & INVOICES
  // ==========================================
  console.log('Generating fulfilled orders and subscriptions...');

  // Confirmed deal creating an Order
  const quote4 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1001', customerId: custAcme.id, salesRepId: rep1.id, status: 'CONFIRMED',
      versions: { create: [{ versionNumber: 1, createdById: rep1.id, totalAmount: 124000.00, totalDiscount: 0, riskScore: 5 }] }
    }, include: { versions: true }
  });
  await prisma.quotation.update({ where: { id: quote4.id }, data: { activeVersionId: quote4.versions[0].id } });

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1004', quotationId: quote4.id, customerId: custAcme.id, status: 'PROCESSING', totalAmount: 124000.00,
      items: { create: [ { productId: prodFirewall.id, snapshotName: 'Enterprise Firewall', quantity: 15, snapshotUnitPrice: 4200.00, snapshotDiscount: 0 } ] },
      invoices: { create: [ { invoiceNumber: 'INV-2026-001', customerId: custAcme.id, status: 'DRAFT', dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), totalAmount: 124000.00 } ] }
    }
  });

  await prisma.fulfillmentPlan.create({
    data: {
      orderId: order1.id, optimizationMode: 'MIN_SHIPMENTS', totalCost: 150.00, shipmentCount: 2, estimatedDelivery: new Date(),
      items: { create: [
        { productId: prodFirewall.id, warehouseId: whAhmd.id, quantity: 10, status: 'SHIPPED' },
        { productId: prodFirewall.id, warehouseId: whAnnd.id, quantity: 5, status: 'PENDING' }
      ]}
    }
  });

  console.log('✅ Seeding completed! Database is full of realistic mock data.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
