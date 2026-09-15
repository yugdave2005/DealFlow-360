import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n===============================================================');
  console.log('🚀 DEALFLOW 360 — ENTERPRISE DATABASE RESET & SEEDING ENGINE');
  console.log('===============================================================\n');

  const startTime = Date.now();

  // ==========================================
  // STEP 1: CLEANUP DATABASE (Correct FK Order)
  // ==========================================
  console.log('🧹 [1/8] Clearing all existing database records...');
  
  const paymentDel = await prisma.payment.deleteMany({});
  const invoiceDel = await prisma.invoice.deleteMany({});
  const subDel = await prisma.subscription.deleteMany({});
  const fulItemDel = await prisma.fulfillmentItem.deleteMany({});
  const fulPlanDel = await prisma.fulfillmentPlan.deleteMany({});
  const ordItemDel = await prisma.orderItem.deleteMany({});
  const ordDel = await prisma.order.deleteMany({});
  const auditDel = await prisma.auditLog.deleteMany({});
  const outboxDel = await prisma.outboxEvent.deleteMany({});
  const msgDel = await prisma.negotiationMessage.deleteMany({});
  const apprDel = await prisma.approvalRequest.deleteMany({});
  const quoItemDel = await prisma.quotationItem.deleteMany({});
  
  // Unlink activeVersionId before removing versions and quotations
  await prisma.quotation.updateMany({ data: { activeVersionId: null } });
  const qvDel = await prisma.quotationVersion.deleteMany({});
  const quoDel = await prisma.quotation.deleteMany({});
  
  const invDel = await prisma.inventory.deleteMany({});
  const whDel = await prisma.warehouse.deleteMany({});
  const apprRuleDel = await prisma.approvalRule.deleteMany({});
  const discRuleDel = await prisma.discountRule.deleteMany({});
  const priceDel = await prisma.productPricing.deleteMany({});
  const prodDel = await prisma.product.deleteMany({});
  const tierDel = await prisma.customerTier.deleteMany({});
  const usrDel = await prisma.user.deleteMany({});

  console.log(`   ✓ Wiped: ${usrDel.count} Users, ${prodDel.count} Products, ${quoDel.count} Quotes, ${ordDel.count} Orders`);
  console.log('   ✓ Database is clean and ready for structured seed data.\n');

  // ==========================================
  // STEP 2: USERS (With Semantic usr_* IDs)
  // ==========================================
  console.log('👤 [2/8] Seeding Enterprise Users & Stakeholders...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      id: 'usr_admin_01',
      name: 'Admin Operations',
      email: 'admin@dealflow360.com',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const manager = await prisma.user.create({
    data: {
      id: 'usr_mgr_sarah',
      name: 'Sarah Connor (Sales VP)',
      email: 'manager@dealflow360.com',
      passwordHash,
      role: 'SALES_MANAGER'
    }
  });

  const rep1 = await prisma.user.create({
    data: {
      id: 'usr_rep_jim',
      name: 'Jim Halpert (Senior Executive)',
      email: 'sales1@dealflow360.com',
      passwordHash,
      role: 'SALES_REP'
    }
  });

  const rep2 = await prisma.user.create({
    data: {
      id: 'usr_rep_dwight',
      name: 'Dwight Schrute (Regional Executive)',
      email: 'sales2@dealflow360.com',
      passwordHash,
      role: 'SALES_REP'
    }
  });

  const finance = await prisma.user.create({
    data: {
      id: 'usr_fin_oscar',
      name: 'Oscar Martinez (CFO & Finance)',
      email: 'finance@dealflow360.com',
      passwordHash,
      role: 'FINANCE'
    }
  });

  const operations = await prisma.user.create({
    data: {
      id: 'usr_ops_kevin',
      name: 'Kevin Malone (Supply Chain & Logistics)',
      email: 'operations@dealflow360.com',
      passwordHash,
      role: 'OPERATIONS'
    }
  });

  const custAcme = await prisma.user.create({
    data: {
      id: 'usr_cust_acme',
      name: 'Acme Corporation (Enterprise Client)',
      email: 'acme@client.com',
      passwordHash,
      role: 'CUSTOMER'
    }
  });

  const custStark = await prisma.user.create({
    data: {
      id: 'usr_cust_stark',
      name: 'Stark Industries (Strategic Client)',
      email: 'stark@client.com',
      passwordHash,
      role: 'CUSTOMER'
    }
  });

  const custGlobal = await prisma.user.create({
    data: {
      id: 'usr_cust_global',
      name: 'Global Net Solutions (Standard Client)',
      email: 'global@client.com',
      passwordHash,
      role: 'CUSTOMER'
    }
  });

  console.log('   ✓ Created 9 enterprise users across all 6 RBAC roles.');

  // ==========================================
  // STEP 3: CUSTOMER TIERS (tier_*)
  // ==========================================
  console.log('\n🏷️  [3/8] Seeding Customer Tiers...');
  const tierEnterprise = await prisma.customerTier.create({
    data: {
      id: 'tier_enterprise',
      name: 'ENTERPRISE',
      description: 'Fortune 500 Strategic Accounts — 15% max commercial discount threshold'
    }
  });

  const tierGold = await prisma.customerTier.create({
    data: {
      id: 'tier_gold',
      name: 'GOLD',
      description: 'Mid-Market High-Growth Partners — 12% max commercial discount threshold'
    }
  });

  const tierStandard = await prisma.customerTier.create({
    data: {
      id: 'tier_standard',
      name: 'STANDARD',
      description: 'Standard Commercial Business — 10% max commercial discount threshold'
    }
  });

  console.log('   ✓ Created 3 Customer Tiers (tier_enterprise, tier_gold, tier_standard)');

  // ==========================================
  // STEP 4: PRODUCTS & PRICING (prod_*, prc_*)
  // ==========================================
  console.log('\n📦 [4/8] Seeding Product Catalog & Multi-Tier Pricing Matrix...');

  // Hardware Products
  const prodLaptop = await prisma.product.create({
    data: {
      id: 'prod_hw_dell_lat5540',
      name: 'Dell Latitude 5540 Enterprise Laptop (i7/32GB/1TB SSD)',
      category: 'HARDWARE',
      quantityOnHand: 150,
      pricing: {
        create: [
          { id: 'prc_hw_dell_base', price: 85000.00 },
          { id: 'prc_hw_dell_ent', customerTierId: tierEnterprise.id, price: 78000.00 },
          { id: 'prc_hw_dell_gld', customerTierId: tierGold.id, price: 82000.00 },
          { id: 'prc_hw_dell_std', customerTierId: tierStandard.id, price: 85000.00 }
        ]
      }
    }
  });

  const prodMonitor = await prisma.product.create({
    data: {
      id: 'prod_hw_lg_ultrawide34',
      name: 'LG UltraWide 34" Curved IPS Ergonomic Display',
      category: 'HARDWARE',
      quantityOnHand: 80,
      pricing: {
        create: [
          { id: 'prc_hw_lg_base', price: 45000.00 },
          { id: 'prc_hw_lg_ent', customerTierId: tierEnterprise.id, price: 42000.00 },
          { id: 'prc_hw_lg_gld', customerTierId: tierGold.id, price: 43500.00 }
        ]
      }
    }
  });

  const prodFirewall = await prisma.product.create({
    data: {
      id: 'prod_hw_fw_x500',
      name: 'Next-Gen Enterprise Firewall Appliance X-500',
      category: 'HARDWARE',
      quantityOnHand: 55,
      pricing: {
        create: [
          { id: 'prc_hw_fw_base', price: 4800.00 },
          { id: 'prc_hw_fw_ent', customerTierId: tierEnterprise.id, price: 4200.00 },
          { id: 'prc_hw_fw_gld', customerTierId: tierGold.id, price: 4500.00 }
        ]
      }
    }
  });

  const prodSwitch = await prisma.product.create({
    data: {
      id: 'prod_hw_cisco_cat48',
      name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
      category: 'HARDWARE',
      quantityOnHand: 35,
      pricing: {
        create: [
          { id: 'prc_hw_sw_base', price: 125000.00 },
          { id: 'prc_hw_sw_ent', customerTierId: tierEnterprise.id, price: 115000.00 }
        ]
      }
    }
  });

  // Services
  const prodImplementation = await prisma.product.create({
    data: {
      id: 'prod_svc_impl_setup',
      name: 'Turnkey Enterprise Implementation & Onboarding Service',
      category: 'SERVICES',
      quantityOnHand: 9999,
      pricing: {
        create: [
          { id: 'prc_svc_impl_base', price: 15000.00 },
          { id: 'prc_svc_impl_ent', customerTierId: tierEnterprise.id, price: 12000.00 }
        ]
      }
    }
  });

  const prodMigration = await prisma.product.create({
    data: {
      id: 'prod_svc_oracle_pg_migr',
      name: 'Zero-Downtime Oracle to Cloud PostgreSQL Migration',
      category: 'SERVICES',
      quantityOnHand: 9999,
      pricing: {
        create: [
          { id: 'prc_svc_migr_base', price: 125000.00 },
          { id: 'prc_svc_migr_ent', customerTierId: tierEnterprise.id, price: 110000.00 }
        ]
      }
    }
  });

  // Subscriptions
  const prodSupportPlan = await prisma.product.create({
    data: {
      id: 'prod_sub_prem_support',
      name: '24/7 Dedicated Platinum SLA Support Plan',
      category: 'SUBSCRIPTION',
      isSubscription: true,
      recurringInterval: 'MONTHLY',
      quantityOnHand: 9999,
      pricing: {
        create: [
          { id: 'prc_sub_supp_base', price: 4999.00 },
          { id: 'prc_sub_supp_ent', customerTierId: tierEnterprise.id, price: 3999.00 },
          { id: 'prc_sub_supp_gld', customerTierId: tierGold.id, price: 4499.00 }
        ]
      }
    }
  });

  const prodCloudSecurity = await prisma.product.create({
    data: {
      id: 'prod_sub_cloud_sec_saas',
      name: 'DealFlow Zero-Trust Cloud Endpoint Security (SaaS)',
      category: 'SUBSCRIPTION',
      isSubscription: true,
      recurringInterval: 'MONTHLY',
      quantityOnHand: 9999,
      pricing: {
        create: [
          { id: 'prc_sub_sec_base', price: 45.00 },
          { id: 'prc_sub_sec_ent', customerTierId: tierEnterprise.id, price: 35.00 },
          { id: 'prc_sub_sec_gld', customerTierId: tierGold.id, price: 40.00 }
        ]
      }
    }
  });

  console.log('   ✓ Created 8 Products with Tiered Pricing (4 Hardware, 2 Services, 2 Subscriptions)');

  // ==========================================
  // STEP 5: WAREHOUSES & INVENTORY (wh_*, inv_*)
  // ==========================================
  console.log('\n🏭 [5/8] Seeding Logistics Warehouses & Stock Inventory...');

  const whAhmd = await prisma.warehouse.create({
    data: { id: 'wh_ahm_central', code: 'W-AHM-01', name: 'Ahmedabad Central Logistics Hub', location: 'Ahmedabad, Gujarat' }
  });
  const whMehs = await prisma.warehouse.create({
    data: { id: 'wh_meh_regional', code: 'W-MEH-01', name: 'Mehsana Regional Depot', location: 'Mehsana, Gujarat' }
  });
  const whAnnd = await prisma.warehouse.create({
    data: { id: 'wh_and_distrib', code: 'W-AND-01', name: 'Anand Distribution Center', location: 'Anand, Gujarat' }
  });
  const whKhed = await prisma.warehouse.create({
    data: { id: 'wh_khd_storage', code: 'W-KHD-01', name: 'Kheda Master Storage Facility', location: 'Kheda, Gujarat' }
  });
  const whGnr = await prisma.warehouse.create({
    data: { id: 'wh_gnr_express', code: 'W-GNR-01', name: 'Gandhinagar Express Tech Hub', location: 'Gandhinagar, Gujarat' }
  });

  const inventoryRecords = [
    // Dell Laptops across 4 hubs
    { id: 'inv_dell_ahm', warehouseId: whAhmd.id, productId: prodLaptop.id, availableQuantity: 50, reservedQuantity: 0 },
    { id: 'inv_dell_meh', warehouseId: whMehs.id, productId: prodLaptop.id, availableQuantity: 20, reservedQuantity: 0 },
    { id: 'inv_dell_and', warehouseId: whAnnd.id, productId: prodLaptop.id, availableQuantity: 30, reservedQuantity: 0 },
    { id: 'inv_dell_gnr', warehouseId: whGnr.id, productId: prodLaptop.id, availableQuantity: 50, reservedQuantity: 0 },

    // LG Monitors
    { id: 'inv_lg_ahm', warehouseId: whAhmd.id, productId: prodMonitor.id, availableQuantity: 40, reservedQuantity: 0 },
    { id: 'inv_lg_and', warehouseId: whAnnd.id, productId: prodMonitor.id, availableQuantity: 25, reservedQuantity: 0 },
    { id: 'inv_lg_gnr', warehouseId: whGnr.id, productId: prodMonitor.id, availableQuantity: 15, reservedQuantity: 0 },

    // Firewalls
    { id: 'inv_fw_ahm', warehouseId: whAhmd.id, productId: prodFirewall.id, availableQuantity: 40, reservedQuantity: 0 },
    { id: 'inv_fw_and', warehouseId: whAnnd.id, productId: prodFirewall.id, availableQuantity: 15, reservedQuantity: 0 },

    // Cisco Switches
    { id: 'inv_sw_ahm', warehouseId: whAhmd.id, productId: prodSwitch.id, availableQuantity: 15, reservedQuantity: 0 },
    { id: 'inv_sw_meh', warehouseId: whMehs.id, productId: prodSwitch.id, availableQuantity: 10, reservedQuantity: 0 },
    { id: 'inv_sw_khd', warehouseId: whKhed.id, productId: prodSwitch.id, availableQuantity: 10, reservedQuantity: 0 },
  ];

  for (const inv of inventoryRecords) {
    await prisma.inventory.create({ data: inv });
  }

  console.log('   ✓ Created 5 Warehouses and 12 Distributed Inventory Stock Records.');

  // ==========================================
  // STEP 6: BUSINESS RULES (disc_rule_*, appr_rule_*)
  // ==========================================
  console.log('\n⚙️  [6/8] Seeding Governance Rules (Discounts & Approval Thresholds)...');

  const discountRules = [
    { id: 'disc_rule_cat_hw', appliedTo: 'CATEGORY', productCategory: 'HARDWARE', maxDiscountPercentage: 15 },
    { id: 'disc_rule_cat_svc', appliedTo: 'CATEGORY', productCategory: 'SERVICES', maxDiscountPercentage: 10 },
    { id: 'disc_rule_cat_sub', appliedTo: 'CATEGORY', productCategory: 'SUBSCRIPTION', maxDiscountPercentage: 12 },
    { id: 'disc_rule_tier_ent', appliedTo: 'TIER', targetTierId: tierEnterprise.id, maxDiscountPercentage: 15 },
    { id: 'disc_rule_tier_gld', appliedTo: 'TIER', targetTierId: tierGold.id, maxDiscountPercentage: 12 },
    { id: 'disc_rule_tier_std', appliedTo: 'TIER', targetTierId: tierStandard.id, maxDiscountPercentage: 10 },
  ];

  for (const dr of discountRules) {
    await prisma.discountRule.create({ data: dr });
  }

  const approvalRules = [
    { id: 'appr_rule_tier1_auto', minRiskScore: 0, maxRiskScore: 25, requiredApproverLevel: 'SALES_REP', priority: 1 },
    { id: 'appr_rule_tier2_mgr', minRiskScore: 26, maxRiskScore: 50, requiredApproverLevel: 'SALES_MANAGER', priority: 2 },
    { id: 'appr_rule_tier3_fin', minRiskScore: 51, maxRiskScore: 75, requiredApproverLevel: 'FINANCE', priority: 3 },
    { id: 'appr_rule_tier4_adm', minRiskScore: 76, maxRiskScore: 100, requiredApproverLevel: 'ADMIN', priority: 4 },
  ];

  for (const ar of approvalRules) {
    await prisma.approvalRule.create({ data: ar });
  }

  console.log('   ✓ Created 6 Category/Tier Discount Rules & 4 Dynamic Approval Level Rules.');

  // ==========================================
  // STEP 7: SAMPLE PIPELINE QUOTATIONS & ORDERS
  // ==========================================
  console.log('\n📑 [7/8] Seeding Quotations, Negotiated Versions, Orders & Invoices...');

  // Quotation 1: PENDING_APPROVAL (Risk Score: 68 -> Needs Sales Manager & Finance sign-off)
  const quote1 = await prisma.quotation.create({
    data: {
      id: 'quo_2026_1042',
      quotationNumber: 'QT-2026-1042',
      customerId: custAcme.id,
      salesRepId: rep1.id,
      status: 'PENDING_APPROVAL',
      versions: {
        create: [{
          id: 'qv_2026_1042_v1',
          versionNumber: 1,
          createdById: rep1.id,
          totalAmount: 408000.00,
          totalDiscount: 72000.00,
          riskScore: 68,
          internalNotes: 'Strategic bulk purchase — requesting expedited manager review.',
          items: {
            create: [
              {
                id: 'qi_1042_fw',
                productId: prodFirewall.id,
                quantity: 100,
                unitPrice: 4800.00,
                discountPercentage: 15.00
              }
            ]
          },
          approvals: {
            create: [{
              id: 'apr_1042_mgr',
              assignedRole: 'SALES_MANAGER',
              status: 'PENDING',
              comments: '15% high volume discount on 100 firewalls awaiting manager sign-off.'
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

  // Quotation 2: DRAFT
  const quote2 = await prisma.quotation.create({
    data: {
      id: 'quo_2026_1043',
      quotationNumber: 'QT-2026-1043',
      customerId: custGlobal.id,
      salesRepId: rep2.id,
      status: 'DRAFT',
      versions: {
        create: [{
          id: 'qv_2026_1043_v1',
          versionNumber: 1,
          createdById: rep2.id,
          totalAmount: 18000.00,
          totalDiscount: 0,
          riskScore: 10,
          internalNotes: 'Draft SaaS endpoint security provisioning.',
          items: {
            create: [
              {
                id: 'qi_1043_sec',
                productId: prodCloudSecurity.id,
                quantity: 500,
                unitPrice: 36.00,
                discountPercentage: 0
              }
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

  // Quotation 3: SENT (With customer negotiation message)
  const quote3 = await prisma.quotation.create({
    data: {
      id: 'quo_2026_1044',
      quotationNumber: 'QT-2026-1044',
      customerId: custStark.id,
      salesRepId: rep1.id,
      status: 'SENT',
      versions: {
        create: [{
          id: 'qv_2026_1044_v1',
          versionNumber: 1,
          createdById: rep1.id,
          totalAmount: 116250.00,
          totalDiscount: 8750.00,
          riskScore: 22,
          internalNotes: 'Oracle Migration proposal sent to Stark Industries CTO.',
          items: {
            create: [
              {
                id: 'qi_1044_migr',
                productId: prodMigration.id,
                quantity: 1,
                unitPrice: 125000.00,
                discountPercentage: 7.00
              }
            ]
          },
          messages: {
            create: [{
              id: 'msg_1044_01',
              authorId: rep1.id,
              senderRole: 'SALES_REP',
              content: 'Attached the proposal with 7% preferred partner discount. Ready for final review!',
              isCommercialChange: false
            }]
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

  // Quotation 4: CONFIRMED (With Full Order, Multi-Hub Fulfillment, Invoice & Subscriptions)
  const quote4 = await prisma.quotation.create({
    data: {
      id: 'quo_2026_1001',
      quotationNumber: 'QT-2026-1001',
      customerId: custAcme.id,
      salesRepId: rep1.id,
      status: 'CONFIRMED',
      versions: {
        create: [{
          id: 'qv_2026_1001_v1',
          versionNumber: 1,
          createdById: rep1.id,
          totalAmount: 1170000.00,
          totalDiscount: 0,
          riskScore: 5,
          internalNotes: 'Acme hardware rollout package confirmed and executed.',
          items: {
            create: [
              { id: 'qi_1001_dell', productId: prodLaptop.id, quantity: 10, unitPrice: 85000.00, discountPercentage: 0 },
              { id: 'qi_1001_impl', productId: prodImplementation.id, quantity: 1, unitPrice: 15000.00, discountPercentage: 0 },
              { id: 'qi_1001_supp', productId: prodSupportPlan.id, quantity: 10, unitPrice: 4999.00, discountPercentage: 0 }
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

  // Order for Confirmed Quotation 4
  const order1 = await prisma.order.create({
    data: {
      id: 'ord_2026_1004',
      orderNumber: 'ORD-1004',
      quotationId: quote4.id,
      customerId: custAcme.id,
      status: 'PROCESSING',
      totalAmount: 1170000.00,
      items: {
        create: [
          {
            id: 'oi_1004_dell',
            productId: prodLaptop.id,
            snapshotName: 'Dell Latitude 5540 Enterprise Laptop (i7/32GB/1TB SSD)',
            quantity: 10,
            snapshotUnitPrice: 85000.00,
            snapshotDiscount: 0,
            isSubscription: false
          },
          {
            id: 'oi_1004_impl',
            productId: prodImplementation.id,
            snapshotName: 'Turnkey Enterprise Implementation & Onboarding Service',
            quantity: 1,
            snapshotUnitPrice: 15000.00,
            snapshotDiscount: 0,
            isSubscription: false
          },
          {
            id: 'oi_1004_supp',
            productId: prodSupportPlan.id,
            snapshotName: '24/7 Dedicated Platinum SLA Support Plan',
            quantity: 10,
            snapshotUnitPrice: 4999.00,
            snapshotDiscount: 0,
            isSubscription: true
          }
        ]
      },
      invoices: {
        create: [{
          id: 'inv_2026_001',
          invoiceNumber: 'INV-2026-001',
          customerId: custAcme.id,
          status: 'DRAFT',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          totalAmount: 865000.00,
          taxAmount: 155700.00,
          payments: {
            create: [{
              id: 'pay_2026_001',
              amount: 250000.00,
              paymentMethod: 'NEFT_WIRE_TRANSFER',
              reference: 'TXN-HDFC-9948214'
            }]
          }
        }]
      },
      subscriptions: {
        create: [{
          id: 'sub_2026_001',
          customerId: custAcme.id,
          interval: 'MONTHLY',
          status: 'ACTIVE',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }]
      }
    }
  });

  // Fulfillment Plan for Order 1
  await prisma.fulfillmentPlan.create({
    data: {
      id: 'ful_plan_1004',
      orderId: order1.id,
      optimizationMode: 'MIN_SHIPMENTS',
      totalCost: 2500.00,
      shipmentCount: 2,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            id: 'ful_item_1004_1',
            productId: prodLaptop.id,
            warehouseId: whAhmd.id,
            quantity: 7,
            status: 'SHIPPED',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'ful_item_1004_2',
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

  // Sample Audit Log
  await prisma.auditLog.create({
    data: {
      id: 'audit_log_init_01',
      actorId: rep1.id,
      entityType: 'QUOTATION',
      entityId: quote1.id,
      action: 'STATUS_CHANGE',
      oldData: { status: 'DRAFT' },
      newData: { status: 'PENDING_APPROVAL' }
    }
  });

  console.log('   ✓ Created 4 Quotations, 1 Order, 1 Invoice, 1 Payment, 1 Subscription & Fulfillment Plan.');

  // ==========================================
  // STEP 8: SUMMARY & CREDENTIALS TABLE
  // ==========================================
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n===============================================================');
  console.log(`🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY in ${duration}s!`);
  console.log('===============================================================');
  console.log('\n📊 SEED DATA OVERVIEW:');
  console.log('  • Users:             9 accounts (Semantic usr_* IDs)');
  console.log('  • Customer Tiers:    3 tiers (tier_enterprise, tier_gold, tier_standard)');
  console.log('  • Products:          8 items (4 Hardware, 2 Services, 2 Subscriptions)');
  console.log('  • Warehouses:        5 hubs (Ahmedabad, Mehsana, Anand, Kheda, Gandhinagar)');
  console.log('  • Inventory Records: 12 stock lines');
  console.log('  • Discount Rules:    6 rules (Category & Tier)');
  console.log('  • Approval Rules:    4 risk-score bands');
  console.log('  • Quotations:        4 quotes (QT-2026-1042, QT-2026-1043, QT-2026-1044, QT-2026-1001)');
  console.log('  • Orders:            1 order (ORD-1004) with multi-shipment plan');
  console.log('  • Invoices:          1 invoice (INV-2026-001) with NEFT payment');
  console.log('  • Subscriptions:     1 active recurring plan');

  console.log('\n🔐 TEST CREDENTIALS (All passwords: password123):');
  console.log('┌──────────────────────┬──────────────────────────┬────────────────────────┐');
  console.log('│ Role                 │ Email                    │ User ID                │');
  console.log('├──────────────────────┼──────────────────────────┼────────────────────────┤');
  console.log('│ Admin                │ admin@dealflow360.com    │ usr_admin_01           │');
  console.log('│ Sales VP / Manager   │ manager@dealflow360.com  │ usr_mgr_sarah          │');
  console.log('│ Sales Rep 1 (Senior) │ sales1@dealflow360.com   │ usr_rep_jim            │');
  console.log('│ Sales Rep 2 (Field)  │ sales2@dealflow360.com   │ usr_rep_dwight         │');
  console.log('│ Finance Controller   │ finance@dealflow360.com  │ usr_fin_oscar          │');
  console.log('│ Logistics & Ops      │ operations@dealflow360.com│ usr_ops_kevin         │');
  console.log('│ Customer (Acme)      │ acme@client.com          │ usr_cust_acme          │');
  console.log('│ Customer (Stark)     │ stark@client.com         │ usr_cust_stark         │');
  console.log('│ Customer (Global)    │ global@client.com        │ usr_cust_global        │');
  console.log('└──────────────────────┴──────────────────────────┴────────────────────────┘\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
