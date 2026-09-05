import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DealFlow360 Database Seeding...');

  // ==========================================
  // CLEAN — Delete in correct FK order
  // ==========================================
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.fulfillmentItem.deleteMany({});
  await prisma.fulfillmentPlan.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.outboxEvent.deleteMany({});
  await prisma.negotiationMessage.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  // Break the activeVersion link before deleting versions
  await prisma.quotation.updateMany({ data: { activeVersionId: null } });
  await prisma.quotationVersion.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.approvalRule.deleteMany({});
  await prisma.discountRule.deleteMany({});
  await prisma.productPricing.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customerTier.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleared existing data');

  // ==========================================
  // 1. USERS — All 6 Roles
  // ==========================================
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin Operations', email: 'admin@dealflow360.com', passwordHash, role: 'ADMIN' }
  });
  const manager = await prisma.user.create({
    data: { name: 'Sarah Connor', email: 'manager@dealflow360.com', passwordHash, role: 'SALES_MANAGER' }
  });
  const rep1 = await prisma.user.create({
    data: { name: 'James Halpert', email: 'sales1@dealflow360.com', passwordHash, role: 'SALES_REP' }
  });
  const rep2 = await prisma.user.create({
    data: { name: 'Dwight Schrute', email: 'sales2@dealflow360.com', passwordHash, role: 'SALES_REP' }
  });
  const finance = await prisma.user.create({
    data: { name: 'Oscar Martinez', email: 'finance@dealflow360.com', passwordHash, role: 'FINANCE' }
  });
  const operations = await prisma.user.create({
    data: { name: 'Kevin Malone', email: 'operations@dealflow360.com', passwordHash, role: 'OPERATIONS' }
  });

  // Customer users (these will login to the customer portal)
  const custAcme = await prisma.user.create({
    data: { name: 'Acme Corporation', email: 'acme@client.com', passwordHash, role: 'CUSTOMER' }
  });
  const custStark = await prisma.user.create({
    data: { name: 'Stark Industries', email: 'stark@client.com', passwordHash, role: 'CUSTOMER' }
  });
  const custGlobal = await prisma.user.create({
    data: { name: 'Global Net Solutions', email: 'global@client.com', passwordHash, role: 'CUSTOMER' }
  });

  console.log('👤 Created 9 users (Admin, Manager, 2 Sales Reps, Finance, Operations, 3 Customers)');

  // ==========================================
  // 2. CUSTOMER TIERS
  // ==========================================
  const tierEnterprise = await prisma.customerTier.create({
    data: { name: 'ENTERPRISE', description: 'Fortune 500 equivalent — 15% general discount limit' }
  });
  const tierGold = await prisma.customerTier.create({
    data: { name: 'GOLD', description: 'Mid-market strategic accounts — 12% general discount limit' }
  });
  const tierStandard = await prisma.customerTier.create({
    data: { name: 'STANDARD', description: 'Standard business accounts — 10% general discount limit' }
  });

  console.log('🏷️  Created 3 customer tiers (Enterprise, Gold, Standard)');

  // ==========================================
  // 3. PRODUCTS — Hardware, Services, Subscriptions
  // ==========================================

  // Hardware
  const prodLaptop = await prisma.product.create({
    data: {
      name: 'Dell Latitude 5540 Laptop', category: 'HARDWARE', quantityOnHand: 150,
      pricing: { create: [
        { price: 85000.00 },  // Base price (no tier)
        { customerTierId: tierEnterprise.id, price: 78000.00 },
        { customerTierId: tierGold.id, price: 82000.00 },
        { customerTierId: tierStandard.id, price: 85000.00 }
      ]}
    }
  });

  const prodMonitor = await prisma.product.create({
    data: {
      name: 'LG UltraWide 34" Monitor', category: 'HARDWARE', quantityOnHand: 80,
      pricing: { create: [
        { price: 45000.00 },
        { customerTierId: tierEnterprise.id, price: 42000.00 },
        { customerTierId: tierGold.id, price: 43500.00 }
      ]}
    }
  });

  const prodFirewall = await prisma.product.create({
    data: {
      name: 'Enterprise Firewall Appliance X-500', category: 'HARDWARE', quantityOnHand: 55,
      pricing: { create: [
        { price: 4800.00 },
        { customerTierId: tierEnterprise.id, price: 4200.00 },
        { customerTierId: tierGold.id, price: 4500.00 }
      ]}
    }
  });

  const prodSwitch = await prisma.product.create({
    data: {
      name: 'Cisco Catalyst 48-Port Switch', category: 'HARDWARE', quantityOnHand: 35,
      pricing: { create: [
        { price: 125000.00 },
        { customerTierId: tierEnterprise.id, price: 115000.00 }
      ]}
    }
  });

  // Services
  const prodImplementation = await prisma.product.create({
    data: {
      name: 'Implementation & Setup Service', category: 'SERVICES', quantityOnHand: 9999,
      pricing: { create: [
        { price: 15000.00 },
        { customerTierId: tierEnterprise.id, price: 12000.00 }
      ]}
    }
  });

  const prodMigration = await prisma.product.create({
    data: {
      name: 'Oracle to PostgreSQL Migration Service', category: 'SERVICES', quantityOnHand: 9999,
      pricing: { create: [
        { price: 125000.00 },
        { customerTierId: tierEnterprise.id, price: 110000.00 }
      ]}
    }
  });

  // Subscriptions
  const prodSupportPlan = await prisma.product.create({
    data: {
      name: 'Premium Support Plan', category: 'SUBSCRIPTION',
      isSubscription: true, recurringInterval: 'MONTHLY', quantityOnHand: 9999,
      pricing: { create: [
        { price: 4999.00 },
        { customerTierId: tierEnterprise.id, price: 3999.00 },
        { customerTierId: tierGold.id, price: 4499.00 }
      ]}
    }
  });

  const prodCloudStorage = await prisma.product.create({
    data: {
      name: 'Managed Cloud Security Endpoint (SaaS)', category: 'SUBSCRIPTION',
      isSubscription: true, recurringInterval: 'MONTHLY', quantityOnHand: 9999,
      pricing: { create: [
        { price: 45.00 },
        { customerTierId: tierEnterprise.id, price: 35.00 },
        { customerTierId: tierGold.id, price: 40.00 }
      ]}
    }
  });

  console.log('📦 Created 8 products (4 Hardware, 2 Services, 2 Subscriptions)');

  // ==========================================
  // 4. WAREHOUSES — 5 Gujarat Hubs
  // ==========================================
  const whAhmd = await prisma.warehouse.create({
    data: { name: 'Ahmedabad Central Hub', code: 'W-AHM-01', location: 'Ahmedabad, Gujarat' }
  });
  const whMehs = await prisma.warehouse.create({
    data: { name: 'Mehsana Regional Depot', code: 'W-MEH-01', location: 'Mehsana, Gujarat' }
  });
  const whAnnd = await prisma.warehouse.create({
    data: { name: 'Anand Distribution Center', code: 'W-AND-01', location: 'Anand, Gujarat' }
  });
  const whKhed = await prisma.warehouse.create({
    data: { name: 'Kheda Storage Facility', code: 'W-KHD-01', location: 'Kheda, Gujarat' }
  });
  const whGnr = await prisma.warehouse.create({
    data: { name: 'Gandhinagar Express Hub', code: 'W-GNR-01', location: 'Gandhinagar, Gujarat' }
  });

  console.log('🏭 Created 5 warehouses');

  // ==========================================
  // 5. INVENTORY — Distributed across warehouses
  // ==========================================
  const inventoryData = [
    // Laptops spread across 4 warehouses
    { warehouseId: whAhmd.id, productId: prodLaptop.id, availableQuantity: 50, reservedQuantity: 0 },
    { warehouseId: whMehs.id, productId: prodLaptop.id, availableQuantity: 20, reservedQuantity: 0 },
    { warehouseId: whAnnd.id, productId: prodLaptop.id, availableQuantity: 30, reservedQuantity: 0 },
    { warehouseId: whGnr.id, productId: prodLaptop.id, availableQuantity: 50, reservedQuantity: 0 },

    // Monitors
    { warehouseId: whAhmd.id, productId: prodMonitor.id, availableQuantity: 40, reservedQuantity: 0 },
    { warehouseId: whAnnd.id, productId: prodMonitor.id, availableQuantity: 25, reservedQuantity: 0 },
    { warehouseId: whGnr.id, productId: prodMonitor.id, availableQuantity: 15, reservedQuantity: 0 },

    // Firewalls
    { warehouseId: whAhmd.id, productId: prodFirewall.id, availableQuantity: 40, reservedQuantity: 0 },
    { warehouseId: whAnnd.id, productId: prodFirewall.id, availableQuantity: 15, reservedQuantity: 0 },

    // Switches
    { warehouseId: whAhmd.id, productId: prodSwitch.id, availableQuantity: 15, reservedQuantity: 0 },
    { warehouseId: whMehs.id, productId: prodSwitch.id, availableQuantity: 10, reservedQuantity: 0 },
    { warehouseId: whKhed.id, productId: prodSwitch.id, availableQuantity: 10, reservedQuantity: 0 },
  ];

  await prisma.inventory.createMany({ data: inventoryData });
  console.log('📊 Created inventory records across 5 warehouses');

  // ==========================================
  // 6. DISCOUNT RULES — Per Category + Tier
  // ==========================================
  await prisma.discountRule.createMany({
    data: [
      // Category-level limits
      { appliedTo: 'CATEGORY', productCategory: 'HARDWARE', maxDiscountPercentage: 15 },
      { appliedTo: 'CATEGORY', productCategory: 'SERVICES', maxDiscountPercentage: 10 },
      { appliedTo: 'CATEGORY', productCategory: 'SUBSCRIPTION', maxDiscountPercentage: 12 },

      // Tier-level limits
      { appliedTo: 'TIER', targetTierId: tierEnterprise.id, maxDiscountPercentage: 15 },
      { appliedTo: 'TIER', targetTierId: tierGold.id, maxDiscountPercentage: 12 },
      { appliedTo: 'TIER', targetTierId: tierStandard.id, maxDiscountPercentage: 10 },
    ]
  });

  console.log('📏 Created 6 discount rules (3 category + 3 tier)');

  // ==========================================
  // 7. APPROVAL RULES — Risk Score Bands
  // ==========================================
  await prisma.approvalRule.createMany({
    data: [
      { minRiskScore: 0,  maxRiskScore: 25,  requiredApproverLevel: 'SALES_REP',     priority: 1 },
      { minRiskScore: 26, maxRiskScore: 50,  requiredApproverLevel: 'SALES_MANAGER', priority: 2 },
      { minRiskScore: 51, maxRiskScore: 75,  requiredApproverLevel: 'FINANCE',       priority: 3 },
      { minRiskScore: 76, maxRiskScore: 100, requiredApproverLevel: 'ADMIN',         priority: 4 },
    ]
  });

  console.log('✅ Created 4 approval rules (score 0-25: auto, 26-50: manager, 51-75: finance, 76-100: admin)');

  // ==========================================
  // 8. SAMPLE QUOTATIONS — Various states for pipeline
  // ==========================================

  // Quote 1: PENDING_APPROVAL — High discount triggers approval
  const quote1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1042',
      customerId: custAcme.id,
      salesRepId: rep1.id,
      status: 'PENDING_APPROVAL',
      versions: {
        create: [{
          versionNumber: 1,
          createdById: rep1.id,
          totalAmount: 408000.00,
          totalDiscount: 72000.00,
          riskScore: 68,
          items: {
            create: [
              { productId: prodFirewall.id, quantity: 100, unitPrice: 4800.00, discountPercentage: 15.00 }
            ]
          },
          approvals: {
            create: [{
              assignedRole: 'SALES_MANAGER',
              status: 'PENDING',
              comments: '15% discount on 100 firewalls needs manager sign-off.'
            }]
          }
        }]
      }
    },
    include: { versions: true }
  });
  await prisma.quotation.update({
    where: { id: quote1.id },
    data: { activeVersionId: quote1.versions[0].id }
  });

  // Quote 2: DRAFT — Stalled
  const quote2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1043',
      customerId: custGlobal.id,
      salesRepId: rep2.id,
      status: 'DRAFT',
      versions: {
        create: [{
          versionNumber: 1,
          createdById: rep2.id,
          totalAmount: 18000.00,
          totalDiscount: 0,
          riskScore: 10,
          items: {
            create: [
              { productId: prodCloudStorage.id, quantity: 500, unitPrice: 36.00, discountPercentage: 0 }
            ]
          }
        }]
      }
    },
    include: { versions: true }
  });
  await prisma.quotation.update({
    where: { id: quote2.id },
    data: { activeVersionId: quote2.versions[0].id }
  });

  // Quote 3: SENT — Waiting for customer response
  const quote3 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1044',
      customerId: custStark.id,
      salesRepId: rep1.id,
      status: 'SENT',
      versions: {
        create: [{
          versionNumber: 1,
          createdById: rep1.id,
          totalAmount: 116250.00,
          totalDiscount: 8750.00,
          riskScore: 22,
          items: {
            create: [
              { productId: prodMigration.id, quantity: 1, unitPrice: 125000.00, discountPercentage: 7.0 }
            ]
          }
        }]
      }
    },
    include: { versions: true }
  });
  await prisma.quotation.update({
    where: { id: quote3.id },
    data: { activeVersionId: quote3.versions[0].id }
  });

  // Quote 4: CONFIRMED — With Order, Fulfillment, and Invoice
  const quote4 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-1001',
      customerId: custAcme.id,
      salesRepId: rep1.id,
      status: 'CONFIRMED',
      versions: {
        create: [{
          versionNumber: 1,
          createdById: rep1.id,
          totalAmount: 1170000.00,
          totalDiscount: 0,
          riskScore: 5,
          items: {
            create: [
              { productId: prodLaptop.id, quantity: 10, unitPrice: 85000.00, discountPercentage: 0 },
              { productId: prodImplementation.id, quantity: 1, unitPrice: 15000.00, discountPercentage: 0 },
              { productId: prodSupportPlan.id, quantity: 10, unitPrice: 4999.00, discountPercentage: 0 }
            ]
          }
        }]
      }
    },
    include: { versions: true }
  });
  await prisma.quotation.update({
    where: { id: quote4.id },
    data: { activeVersionId: quote4.versions[0].id }
  });

  // Create Order for confirmed quotation
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1004',
      quotationId: quote4.id,
      customerId: custAcme.id,
      status: 'PROCESSING',
      totalAmount: 1170000.00,
      items: {
        create: [
          {
            productId: prodLaptop.id,
            snapshotName: 'Dell Latitude 5540 Laptop',
            quantity: 10,
            snapshotUnitPrice: 85000.00,
            snapshotDiscount: 0,
            isSubscription: false
          },
          {
            productId: prodImplementation.id,
            snapshotName: 'Implementation & Setup Service',
            quantity: 1,
            snapshotUnitPrice: 15000.00,
            snapshotDiscount: 0,
            isSubscription: false
          },
          {
            productId: prodSupportPlan.id,
            snapshotName: 'Premium Support Plan',
            quantity: 10,
            snapshotUnitPrice: 4999.00,
            snapshotDiscount: 0,
            isSubscription: true
          }
        ]
      },
      invoices: {
        create: [{
          invoiceNumber: 'INV-2026-001',
          customerId: custAcme.id,
          status: 'DRAFT',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          totalAmount: 865000.00,  // One-time items only (laptops + implementation)
          taxAmount: 155700.00     // 18% GST
        }]
      },
      subscriptions: {
        create: [{
          customerId: custAcme.id,
          interval: 'MONTHLY',
          status: 'ACTIVE',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }]
      }
    }
  });

  // Fulfillment plan for order1
  await prisma.fulfillmentPlan.create({
    data: {
      orderId: order1.id,
      optimizationMode: 'MIN_SHIPMENTS',
      totalCost: 2500.00,
      shipmentCount: 2,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodLaptop.id,
            warehouseId: whAhmd.id,
            quantity: 7,
            status: 'SHIPPED',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          },
          {
            productId: prodLaptop.id,
            warehouseId: whGnr.id,
            quantity: 3,
            status: 'PENDING',
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    }
  });

  console.log('📋 Created 4 sample quotations + 1 order + fulfillment + invoice + subscription');

  // ==========================================
  // 9. AUDIT LOG SAMPLE
  // ==========================================
  await prisma.auditLog.create({
    data: {
      actorId: rep1.id,
      entityType: 'QUOTATION',
      entityId: quote1.id,
      action: 'STATUS_CHANGE',
      oldData: { status: 'DRAFT' },
      newData: { status: 'PENDING_APPROVAL' }
    }
  });

  console.log('📝 Created sample audit log entry');

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n✅ DealFlow360 Seeding Complete!');
  console.log('────────────────────────────────');
  console.log('Users:              9 (Admin, Manager, 2 Reps, Finance, Operations, 3 Customers)');
  console.log('Customer Tiers:     3 (Enterprise, Gold, Standard)');
  console.log('Products:           8 (4 Hardware, 2 Services, 2 Subscriptions)');
  console.log('Warehouses:         5 (Ahmedabad, Mehsana, Anand, Kheda, Gandhinagar)');
  console.log('Inventory Records:  12');
  console.log('Discount Rules:     6 (3 category + 3 tier)');
  console.log('Approval Rules:     4 (per risk score band)');
  console.log('Quotations:         4 (PENDING_APPROVAL, DRAFT, SENT, CONFIRMED)');
  console.log('Orders:             1 (with items + fulfillment + invoice + subscription)');
  console.log('────────────────────────────────');
  console.log('\n🔑 Login Credentials (all passwords: password123):');
  console.log('  Admin:          admin@dealflow360.com');
  console.log('  Sales Manager:  manager@dealflow360.com');
  console.log('  Sales Rep 1:    sales1@dealflow360.com');
  console.log('  Sales Rep 2:    sales2@dealflow360.com');
  console.log('  Finance:        finance@dealflow360.com');
  console.log('  Operations:     operations@dealflow360.com');
  console.log('  Customer Acme:  acme@client.com');
  console.log('  Customer Stark: stark@client.com');
  console.log('  Customer Global: global@client.com');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
