import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DealFlow 360 Mega Seed (>500 entities)...');

  // 1. Clean DB in order
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

  console.log('🧹 Cleaned existing database records.');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Customer Tiers
  const tierEnterprise = await prisma.customerTier.create({
    data: { name: 'ENTERPRISE', description: 'Enterprise tier — 15% discount ceiling' }
  });
  const tierGold = await prisma.customerTier.create({
    data: { name: 'GOLD', description: 'Gold strategic tier — 12% discount ceiling' }
  });
  const tierSilver = await prisma.customerTier.create({
    data: { name: 'SILVER', description: 'Silver tier — 10% discount ceiling' }
  });
  const tierStandard = await prisma.customerTier.create({
    data: { name: 'STANDARD', description: 'Standard tier — 8% discount ceiling' }
  });

  // 3. System Users
  const admin = await prisma.user.create({
    data: { name: 'Admin Operations', email: 'admin@dealflow360.com', passwordHash, role: 'ADMIN' }
  });
  const manager = await prisma.user.create({
    data: { name: 'Sarah Connor (VP Sales)', email: 'manager@dealflow360.com', passwordHash, role: 'SALES_MANAGER' }
  });
  const rep1 = await prisma.user.create({
    data: { name: 'James Halpert', email: 'sales1@dealflow360.com', passwordHash, role: 'SALES_REP' }
  });
  const rep2 = await prisma.user.create({
    data: { name: 'Dwight Schrute', email: 'sales2@dealflow360.com', passwordHash, role: 'SALES_REP' }
  });
  const rep3 = await prisma.user.create({
    data: { name: 'Pam Beesly', email: 'sales3@dealflow360.com', passwordHash, role: 'SALES_REP' }
  });
  const finance = await prisma.user.create({
    data: { name: 'Oscar Martinez', email: 'finance@dealflow360.com', passwordHash, role: 'FINANCE' }
  });
  const operations = await prisma.user.create({
    data: { name: 'Kevin Malone', email: 'operations@dealflow360.com', passwordHash, role: 'OPERATIONS' }
  });

  const reps = [rep1, rep2, rep3];

  // 4. Customer Organizations (25 customers)
  const customerNames = [
    'Acme Corp', 'Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems', 'Initech Systems',
    'Massive Dynamic', 'Umbrella Health', 'Hooli Tech', 'Pied Piper Inc', 'Aperture Science',
    'Omni Consumer Products', 'Weyland-Yutani Corp', 'Tyrell Robotics', 'Oscorp Technologies', 'LexCorp Global',
    'Soylent Financial', 'Gekko & Co Holdings', 'Wonka Logistics', 'Dunder Mifflin Paper', 'Vandelay Industries',
    'Globex Corporation', 'Bluth Company', 'Prestige Worldwide', 'Nakamura Bio', 'Sartori Cloud'
  ];

  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const cust = await prisma.user.create({
      data: {
        name: customerNames[i],
        email: `contact@${customerNames[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        passwordHash,
        role: 'CUSTOMER'
      }
    });
    customers.push(cust);
  }
  console.log(`👤 Created ${customers.length + 7} Users (Internal Staff + Customers).`);

  // 5. Warehouses (7 Hubs)
  const warehousesData = [
    { code: 'WH-MUM-01', name: 'Mumbai Central Hub', location: 'Bhiwandi, Mumbai, MH' },
    { code: 'WH-BLR-02', name: 'Bengaluru Tech Logistics', location: 'Peenya Industrial Area, Bengaluru, KA' },
    { code: 'WH-DEL-03', name: 'Delhi NCR Fulfillment', location: 'Gurugram Sector 37, HR' },
    { code: 'WH-HYD-04', name: 'Hyderabad Distribution Center', location: 'Gachibowli Logistics Park, Hyderabad, TS' },
    { code: 'WH-MAA-05', name: 'Chennai Coastal Gateway', location: 'Sriperumbudur Hub, Chennai, TN' },
    { code: 'WH-PNQ-06', name: 'Pune Western Warehouse', location: 'Chakan Industrial Corridor, Pune, MH' },
    { code: 'WH-AMD-07', name: 'Ahmedabad North Hub', location: 'Sanand Industrial Estate, Ahmedabad, GJ' }
  ];

  const warehouses = [];
  for (const wh of warehousesData) {
    warehouses.push(await prisma.warehouse.create({ data: wh }));
  }
  console.log(`🏢 Created ${warehouses.length} Regional Warehouses.`);

  // 6. Products (15 catalog items)
  const productsData = [
    { name: 'Enterprise Rack Server R760', category: 'HARDWARE', isSubscription: false, price: 345000 },
    { name: 'Edge AI Compute Gateway Node', category: 'HARDWARE', isSubscription: false, price: 125000 },
    { name: 'Cisco Catalyst 48-Port Switch', category: 'HARDWARE', isSubscription: false, price: 185000 },
    { name: 'FortiGate 200F Security Appliance', category: 'HARDWARE', isSubscription: false, price: 215000 },
    { name: 'Dell UltraSharp 32" 4K Monitor', category: 'HARDWARE', isSubscription: false, price: 68000 },
    { name: 'Enterprise Fiber Router XG', category: 'HARDWARE', isSubscription: false, price: 92000 },
    { name: 'IoT Telemetry Industrial Sensor Pack', category: 'HARDWARE', isSubscription: false, price: 45000 },
    { name: 'On-Site Deployment & Cabling Service', category: 'SERVICES', isSubscription: false, price: 50000 },
    { name: 'Custom Cloud Architecture Consulting', category: 'SERVICES', isSubscription: false, price: 120000 },
    { name: 'Cybersecurity Penetration Audit', category: 'SERVICES', isSubscription: false, price: 85000 },
    { name: 'DealFlow 360 SaaS Core License', category: 'SUBSCRIPTIONS', isSubscription: true, recurringInterval: 'MONTHLY', price: 4500 },
    { name: 'AI Revenue Engine Add-on', category: 'SUBSCRIPTIONS', isSubscription: true, recurringInterval: 'MONTHLY', price: 2800 },
    { name: 'Premium 24/7 Dedicated SLA Support', category: 'SUBSCRIPTIONS', isSubscription: true, recurringInterval: 'MONTHLY', price: 15000 },
    { name: 'Managed Cloud Backup 10TB Tier', category: 'SUBSCRIPTIONS', isSubscription: true, recurringInterval: 'MONTHLY', price: 6500 },
    { name: 'Threat Intelligence Live Stream Feed', category: 'SUBSCRIPTIONS', isSubscription: true, recurringInterval: 'QUARTERLY', price: 18000 }
  ];

  const products = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        category: p.category,
        isSubscription: p.isSubscription,
        recurringInterval: p.recurringInterval || null,
        quantityOnHand: p.isSubscription ? 0 : 250,
        pricing: {
          create: [
            { customerTierId: tierEnterprise.id, price: p.price * 0.90 },
            { customerTierId: tierGold.id, price: p.price * 0.95 },
            { customerTierId: tierStandard.id, price: p.price }
          ]
        }
      }
    });
    products.push(prod);
  }
  console.log(`📦 Created ${products.length} Products with Tier Pricing.`);

  // 7. Inventory for Hardware Products across all Warehouses
  let invCount = 0;
  for (const wh of warehouses) {
    for (const prod of products) {
      if (prod.isSubscription) continue;
      const stock = Math.floor(Math.random() * 45) + 15;
      await prisma.inventory.create({
        data: {
          warehouseId: wh.id,
          productId: prod.id,
          availableQuantity: stock,
          reservedQuantity: Math.floor(stock * 0.15)
        }
      });
      invCount++;
    }
  }
  console.log(`📊 Initialized ${invCount} Warehouse Inventory records.`);

  // 8. Approval Rules & Discount Rules
  await prisma.approvalRule.createMany({
    data: [
      { minRiskScore: 0, maxRiskScore: 29, requiredApproverLevel: 'SALES_MANAGER', priority: 1 },
      { minRiskScore: 30, maxRiskScore: 69, requiredApproverLevel: 'SALES_MANAGER', priority: 2 },
      { minRiskScore: 70, maxRiskScore: 100, requiredApproverLevel: 'ADMIN', priority: 3 }
    ]
  });

  await prisma.discountRule.createMany({
    data: [
      { appliedTo: 'TIER', targetTierId: tierEnterprise.id, maxDiscountPercentage: 18 },
      { appliedTo: 'TIER', targetTierId: tierGold.id, maxDiscountPercentage: 14 },
      { appliedTo: 'TIER', targetTierId: tierSilver.id, maxDiscountPercentage: 10 },
      { appliedTo: 'TIER', targetTierId: tierStandard.id, maxDiscountPercentage: 8 },
      { appliedTo: 'CATEGORY', productCategory: 'HARDWARE', maxDiscountPercentage: 15 },
      { appliedTo: 'CATEGORY', productCategory: 'SERVICES', maxDiscountPercentage: 20 },
      { appliedTo: 'CATEGORY', productCategory: 'SUBSCRIPTIONS', maxDiscountPercentage: 25 }
    ]
  });

  // 9. Quotations, Versions, Items, Approvals, Orders, Fulfillment, Invoices, Subscriptions
  const statuses = [
    'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED',
    'SENT', 'SENT', 'SENT',
    'NEGOTIATION', 'NEGOTIATION',
    'PENDING_APPROVAL', 'PENDING_APPROVAL',
    'APPROVED', 'APPROVED',
    'DRAFT', 'DRAFT',
    'CANCELLED'
  ];

  let quoteIdx = 1001;
  let orderIdx = 1001;
  let invIdx = 1001;
  let subIdx = 1001;

  for (let i = 0; i < 45; i++) {
    const cust = customers[i % customers.length];
    const rep = reps[i % reps.length];
    const status = statuses[i % statuses.length];
    const qNum = `QT-2026-${String(quoteIdx++).padStart(4, '0')}`;

    const quote = await prisma.quotation.create({
      data: {
        quotationNumber: qNum,
        customerId: cust.id,
        salesRepId: rep.id,
        status: status === 'CONFIRMED' ? 'CONFIRMED' : status
      }
    });

    // Generate 1 to 2 versions
    const numVersions = (status === 'NEGOTIATION' || status === 'CONFIRMED') ? 2 : 1;
    let activeVer = null;

    for (let v = 1; v <= numVersions; v++) {
      // Pick 2-4 products
      const selectedProds = [
        products[i % 5],
        products[(i + 2) % products.length],
        products[(i + 6) % products.length]
      ];

      const discountPct = v === 1 ? (Math.floor(Math.random() * 8) + 5) : (Math.floor(Math.random() * 8) + 12);
      let vTotal = 0;
      let vDiscount = 0;

      const itemsData = selectedProds.map((p, pIdx) => {
        const qty = Math.floor(Math.random() * 4) + 1;
        const uPrice = p.category === 'SUBSCRIPTIONS' ? 4500 : (p.category === 'SERVICES' ? 65000 : 125000);
        const gross = qty * uPrice;
        const discAmt = gross * (discountPct / 100);
        vTotal += (gross - discAmt);
        vDiscount += discAmt;

        return {
          productId: p.id,
          quantity: qty,
          unitPrice: uPrice,
          discountPercentage: discountPct
        };
      });

      const riskScore = discountPct > 15 ? 75 : discountPct > 10 ? 45 : 18;

      const ver = await prisma.quotationVersion.create({
        data: {
          quotationId: quote.id,
          versionNumber: v,
          totalAmount: vTotal,
          totalDiscount: vDiscount,
          riskScore,
          createdById: rep.id,
          internalNotes: `Standard proposal generated for ${cust.name}. Version ${v}.`,
          items: { create: itemsData }
        },
        include: { items: true }
      });

      activeVer = ver;

      // Approval Request if pending or negotiated
      if (status === 'PENDING_APPROVAL' || riskScore > 30) {
        await prisma.approvalRequest.create({
          data: {
            quotationVersionId: ver.id,
            assignedRole: riskScore > 60 ? 'ADMIN' : 'SALES_MANAGER',
            status: status === 'PENDING_APPROVAL' ? 'PENDING' : 'APPROVED',
            actionedById: status === 'PENDING_APPROVAL' ? null : manager.id,
            comments: `Evaluated discount exception of ${discountPct}%. Standard governance review.`
          }
        });
      }

      // Negotiation message
      if (v > 1 || status === 'NEGOTIATION') {
        await prisma.negotiationMessage.create({
          data: {
            quotationVersionId: ver.id,
            authorId: cust.id,
            senderRole: 'CUSTOMER',
            content: `We request a revised commercial concession to ${discountPct}% to finalize annual procurement.`,
            proposedDiscount: discountPct,
            isCommercialChange: true
          }
        });
      }
    }

    // Link active version
    await prisma.quotation.update({
      where: { id: quote.id },
      data: { activeVersionId: activeVer.id }
    });

    // If CONFIRMED, create Order, FulfillmentPlan, Invoice, Subscriptions
    if (status === 'CONFIRMED') {
      const oNum = `ORD-${String(orderIdx++).padStart(4, '0')}`;
      const order = await prisma.order.create({
        data: {
          orderNumber: oNum,
          quotationId: quote.id,
          customerId: cust.id,
          totalAmount: activeVer.totalAmount,
          status: i % 2 === 0 ? 'PROCESSING' : 'FULFILLED',
          items: {
            create: activeVer.items.map(it => ({
              productId: it.productId,
              snapshotName: `Hardware Unit ${it.productId.slice(0, 6)}`,
              quantity: it.quantity,
              snapshotUnitPrice: it.unitPrice,
              snapshotDiscount: it.discountPercentage,
              isSubscription: false
            }))
          }
        }
      });

      // Fulfillment Plan with multi-warehouse split
      const primaryWh = warehouses[i % warehouses.length];
      const backupWh = warehouses[(i + 1) % warehouses.length];

      await prisma.fulfillmentPlan.create({
        data: {
          orderId: order.id,
          optimizationMode: 'BALANCED',
          totalCost: 1850.00,
          shipmentCount: 2,
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          items: {
            create: activeVer.items.flatMap((it, itIdx) => [
              {
                productId: it.productId,
                quantity: Math.max(1, Math.ceil(it.quantity / 2)),
                warehouseId: primaryWh.id,
                status: 'SHIPPED',
                estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              },
              {
                productId: it.productId,
                quantity: Math.max(1, Math.floor(it.quantity / 2)),
                warehouseId: backupWh.id,
                status: 'SHIPPED',
                estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
              }
            ])
          }
        }
      });

      // Invoice
      const invNum = `INV-2026-${String(invIdx++).padStart(4, '0')}`;
      const invAmount = Number(activeVer.totalAmount);
      const isPaid = i % 3 === 0;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          orderId: order.id,
          customerId: cust.id,
          totalAmount: invAmount,
          taxAmount: Math.round(invAmount * 0.18),
          status: isPaid ? 'PAID' : (i % 2 === 0 ? 'PARTIAL' : 'SENT'),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      if (isPaid || i % 2 === 0) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: isPaid ? Math.round(invAmount * 1.18) : Math.round(invAmount * 0.5),
            paymentMethod: 'BANK_TRANSFER',
            reference: `TXN-REF-${Math.floor(Math.random() * 899999 + 100000)}`
          }
        });
      }

      // Subscription for customer
      await prisma.subscription.create({
        data: {
          orderId: order.id,
          customerId: cust.id,
          interval: 'MONTHLY',
          status: 'ACTIVE',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  console.log(`✅ Database seeding completed successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
