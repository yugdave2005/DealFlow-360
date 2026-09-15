import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDecimal(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function daysFromNow(days) { return new Date(Date.now() + days * 24 * 60 * 60 * 1000); }
function daysAgo(days) { return new Date(Date.now() - days * 24 * 60 * 60 * 1000); }
function randomDate(startDaysAgo, endDaysAgo = 0) {
  const start = daysAgo(startDaysAgo);
  const end = daysAgo(endDaysAgo);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ─── Data Pools ─────────────────────────────────────────────
const PRODUCT_CATEGORIES = ['HARDWARE', 'SERVICES', 'SUBSCRIPTION', 'SOFTWARE', 'NETWORKING', 'SECURITY'];

const HARDWARE_PRODUCTS = [
  'Dell Latitude 5550 Laptop', 'HP EliteBook 840 G10', 'Lenovo ThinkPad X1 Carbon',
  'MacBook Pro 14" M3', 'Dell OptiPlex 7020 Desktop', 'HP Z4 Workstation',
  'LG UltraWide 34" Monitor', 'Dell U2723QE 4K Monitor', 'Samsung Odyssey 32" Curved',
  'BenQ PD3220U Designer Monitor', 'ASUS ProArt PA348CGV', 'AOC U28P2U 28"',
  'Logitech MX Keys Keyboard', 'Logitech MX Master 3S Mouse', 'Dell KM7321W Combo',
  'Cisco Catalyst 9200 Switch', 'Cisco Catalyst 9300 Switch', 'Juniper EX4300',
  'Aruba 2930F Switch', 'HPE FlexNetwork 5140', 'Ubiquiti UniFi Switch Pro',
  'Fortinet FortiGate 60F', 'Fortinet FortiGate 100F', 'Palo Alto PA-440',
  'SonicWall TZ470', 'Cisco Meraki MX68', 'WatchGuard Firebox M290',
  'APC Smart-UPS 1500VA', 'Eaton 5PX 2200VA', 'CyberPower PR2200LCD',
  'Synology DS923+ NAS', 'QNAP TS-464 NAS', 'Dell PowerVault ME5024',
  'HPE ProLiant DL380 Gen11', 'Dell PowerEdge R760', 'Lenovo ThinkSystem SR650 V3',
  'HPE Aruba AP-635 WiFi 6E', 'Cisco Meraki MR56', 'Ubiquiti U6 Enterprise',
  'Brother MFC-L8900CDW Printer', 'HP LaserJet Pro MFP 4101fdw', 'Canon imageCLASS MF753Cdw',
  'Jabra PanaCast 50 Video Bar', 'Poly Studio X30', 'Logitech Rally Bar Mini',
  'Samsung 870 EVO 1TB SSD', 'WD Red Pro 8TB HDD', 'Seagate IronWolf 4TB',
  'Kingston Fury Beast 32GB RAM', 'Corsair Vengeance 64GB DDR5',
  'TP-Link Omada EAP670', 'Netgear WAX630E', 'Ruckus R750',
  'Ergotron LX Monitor Arm', 'Herman Miller Aeron Chair', 'Steelcase Leap V2',
  'Targus Docking Station', 'CalDigit TS4 Thunderbolt Dock', 'Dell WD22TB4',
  'Yealink T58W IP Phone', 'Poly VVX 450', 'Cisco IP Phone 8845',
  'APC NetShelter 42U Rack', 'Tripp Lite SR42UB', 'StarTech 25U Open Frame',
  'Epson ET-5850 Printer', 'Xerox VersaLink C405', 'Ricoh IM C3010',
  'Barco ClickShare CX-50', 'Crestron AirMedia AM-3200', 'Kramer VIA Campus²',
  'Eaton Tripp Lite PDU', 'APC Rack PDU Switched', 'ServerTech CDU',
];

const SERVICE_PRODUCTS = [
  'Implementation & Setup Service', 'Oracle to PostgreSQL Migration',
  'Cloud Infrastructure Setup', 'Network Architecture Design',
  'Security Audit & Penetration Testing', 'Data Center Migration Service',
  'Active Directory Migration', 'Disaster Recovery Planning',
  'IT Infrastructure Assessment', 'Compliance Audit (SOC 2)',
  'DevOps Pipeline Setup', 'Kubernetes Cluster Deployment',
  'Database Performance Tuning', 'Application Performance Monitoring Setup',
  'Custom API Development', 'Legacy System Modernization',
  'VoIP System Installation', 'Wireless Network Survey & Deploy',
  'Server Room Cabling & Setup', 'Endpoint Security Deployment',
  'Email Migration (O365/Google)', 'ERP Implementation Service',
  'CRM Integration Service', 'Business Intelligence Dashboard Setup',
  'Load Testing & Optimization', 'Backup & Recovery Configuration',
  'SIEM Implementation', 'Identity & Access Management Setup',
  'Training Workshop (On-site)', 'Training Workshop (Remote)',
  'Project Management (Monthly)', 'Technical Consultation (Hourly)',
  'Architecture Review Board', 'Code Review & Refactoring',
  'Mobile App Development Sprint', 'QA & Testing Automation Setup',
  'CI/CD Pipeline Configuration', 'Monitoring & Alerting Setup',
  'Documentation & Knowledge Base', 'Change Management Consulting',
];

const SUBSCRIPTION_PRODUCTS = [
  'Premium Support Plan', 'Enterprise Support Plan', 'Basic Support Plan',
  'Managed Cloud Security Endpoint', 'Advanced Threat Protection',
  'Cloud Backup Service', 'Managed Firewall Service',
  'Endpoint Detection & Response', 'Email Security Gateway',
  'DNS Filtering Service', 'Network Monitoring (SaaS)',
  'Log Management & SIEM (SaaS)', 'Vulnerability Scanning Service',
  'Patch Management Service', 'IT Asset Management (SaaS)',
  'Help Desk Ticketing (SaaS)', 'Remote Desktop Management',
  'Cloud Storage (per TB)', 'CDN & Edge Caching Service',
  'API Gateway Service', 'Container Registry Service',
  'Database-as-a-Service', 'Secrets Management Service',
  'Certificate Management', 'DDoS Protection Service',
  'Web Application Firewall', 'Bot Management Service',
  'Identity Provider (IdP)', 'Multi-Factor Authentication',
  'Privileged Access Management', 'Data Loss Prevention',
  'Cloud Cost Optimization Tool', 'Compliance Monitoring',
  'Uptime Monitoring (SaaS)', 'Status Page Service',
  'Incident Management Platform', 'On-Call Scheduling Service',
  'Knowledge Base Platform', 'Project Management (SaaS)',
  'Communication Platform', 'Video Conferencing (SaaS)',
];

const WAREHOUSE_CITIES = [
  'Ahmedabad', 'Mehsana', 'Anand', 'Kheda', 'Gandhinagar',
  'Rajkot', 'Surat', 'Vadodara', 'Bhavnagar', 'Jamnagar',
  'Junagadh', 'Morbi', 'Navsari', 'Valsad', 'Kutch',
  'Patan', 'Banaskantha', 'Sabarkantha', 'Aravalli', 'Dahod',
];

const WAREHOUSE_TYPES = ['Central Hub', 'Regional Depot', 'Distribution Center', 'Storage Facility', 'Express Hub', 'Fulfillment Center', 'Micro Warehouse'];

const COMPANY_SUFFIXES = ['Corporation', 'Industries', 'Solutions', 'Technologies', 'Enterprises', 'Group', 'Systems', 'Holdings', 'Partners', 'Labs', 'Digital', 'Consulting', 'Networks', 'Dynamics', 'International'];

const QUOTATION_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'NEGOTIATION', 'SENT', 'CONFIRMED', 'CONVERTED', 'CANCELLED'];
const ORDER_STATUSES = ['PROCESSING', 'PARTIAL_FULFILLMENT', 'FULFILLED', 'CANCELLED'];
const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE'];
const FULFILLMENT_STATUSES = ['PENDING', 'SHIPPED', 'DELIVERED', 'BACKORDER', 'CANCELLED'];
const SUBSCRIPTION_STATUSES = ['ACTIVE', 'PAUSED', 'CANCELLED'];
const PAYMENT_METHODS = ['CREDIT_CARD', 'BANK_TRANSFER', 'UPI', 'NET_BANKING', 'CHEQUE', 'CASH', 'WIRE_TRANSFER', 'RTGS', 'NEFT', 'IMPS'];
const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'];

const ENTITY_TYPES = ['QUOTATION', 'ORDER', 'INVOICE', 'PAYMENT', 'SUBSCRIPTION', 'PRODUCT', 'INVENTORY', 'USER', 'FULFILLMENT'];
const AUDIT_ACTIONS = ['STATUS_CHANGE', 'CREATED', 'UPDATED', 'DELETED', 'APPROVED', 'REJECTED', 'PRICE_CHANGE', 'QUANTITY_CHANGE', 'DISCOUNT_APPLIED', 'ASSIGNED', 'REASSIGNED', 'EXPORTED', 'IMPORTED', 'ARCHIVED'];
const EVENT_TYPES = ['quotation.created', 'quotation.updated', 'quotation.approved', 'order.created', 'order.fulfilled', 'invoice.generated', 'invoice.paid', 'payment.received', 'subscription.created', 'subscription.renewed', 'inventory.updated', 'fulfillment.shipped', 'user.created', 'notification.sent'];

// ─── Main Seed Function ─────────────────────────────────────
async function main() {
  console.log('🌱 Starting DealFlow360 BULK Database Seeding (300+ records per module)...\n');
  const t0 = Date.now();

  // ==========================================
  // CLEAN — Delete in correct FK order
  // ==========================================
  console.log('🧹 Clearing existing data...');
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
  console.log('✅ Database cleared\n');

  // ==========================================
  // 1. USERS — 350+ (mix of all roles)
  // ==========================================
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Core staff users (keep original logins)
  const coreUsers = [
    { name: 'Admin Operations', email: 'admin@dealflow360.com', passwordHash, role: 'ADMIN' },
    { name: 'Sarah Connor', email: 'manager@dealflow360.com', passwordHash, role: 'SALES_MANAGER' },
    { name: 'James Halpert', email: 'sales1@dealflow360.com', passwordHash, role: 'SALES_REP' },
    { name: 'Dwight Schrute', email: 'sales2@dealflow360.com', passwordHash, role: 'SALES_REP' },
    { name: 'Oscar Martinez', email: 'finance@dealflow360.com', passwordHash, role: 'FINANCE' },
    { name: 'Kevin Malone', email: 'operations@dealflow360.com', passwordHash, role: 'OPERATIONS' },
    { name: 'Acme Corporation', email: 'acme@client.com', passwordHash, role: 'CUSTOMER' },
    { name: 'Stark Industries', email: 'stark@client.com', passwordHash, role: 'CUSTOMER' },
    { name: 'Global Net Solutions', email: 'global@client.com', passwordHash, role: 'CUSTOMER' },
  ];

  // Generate additional staff
  const staffRoles = ['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'FINANCE', 'OPERATIONS'];
  const roleCounts = { ADMIN: 5, SALES_MANAGER: 15, SALES_REP: 40, FINANCE: 10, OPERATIONS: 10 };
  const bulkStaff = [];
  for (const [role, count] of Object.entries(roleCounts)) {
    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      bulkStaff.push({
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'dealflow360.com' }).toLowerCase(),
        passwordHash,
        role,
      });
    }
  }

  // Generate 270+ customer users
  const bulkCustomers = [];
  const usedEmails = new Set(coreUsers.map(u => u.email));
  bulkStaff.forEach(u => usedEmails.add(u.email));

  for (let i = 0; i < 270; i++) {
    const companyName = `${faker.company.name()} ${pick(COMPANY_SUFFIXES)}`;
    let email;
    do {
      email = faker.internet.email({ firstName: companyName.split(' ')[0], lastName: `c${i}`, provider: 'client.com' }).toLowerCase();
    } while (usedEmails.has(email));
    usedEmails.add(email);
    bulkCustomers.push({
      name: companyName,
      email,
      passwordHash,
      role: 'CUSTOMER',
    });
  }

  const allUserData = [...coreUsers, ...bulkStaff, ...bulkCustomers];
  await prisma.user.createMany({ data: allUserData, skipDuplicates: true });
  const allUsers = await prisma.user.findMany();
  const staffUsers = allUsers.filter(u => u.role !== 'CUSTOMER');
  const customerUsers = allUsers.filter(u => u.role === 'CUSTOMER');
  const salesReps = allUsers.filter(u => u.role === 'SALES_REP');
  const managers = allUsers.filter(u => u.role === 'SALES_MANAGER');
  const adminUsers = allUsers.filter(u => u.role === 'ADMIN');
  const financeUsers = allUsers.filter(u => u.role === 'FINANCE');
  console.log(`   ✅ ${allUsers.length} users created`);

  // ==========================================
  // 2. CUSTOMER TIERS — 5
  // ==========================================
  console.log('🏷️  Creating customer tiers...');
  const tierData = [
    { name: 'ENTERPRISE', description: 'Fortune 500 equivalent — 15% general discount limit' },
    { name: 'GOLD', description: 'Mid-market strategic accounts — 12% general discount limit' },
    { name: 'STANDARD', description: 'Standard business accounts — 10% general discount limit' },
    { name: 'SILVER', description: 'Growing accounts with potential — 8% general discount limit' },
    { name: 'BRONZE', description: 'New accounts under evaluation — 5% general discount limit' },
  ];
  await prisma.customerTier.createMany({ data: tierData });
  const tiers = await prisma.customerTier.findMany();
  console.log(`   ✅ ${tiers.length} tiers created`);

  // ==========================================
  // 3. PRODUCTS — 310+ (with pricing)
  // ==========================================
  console.log('📦 Creating products...');

  const productRecords = [];

  // Hardware products (~120)
  for (let i = 0; i < HARDWARE_PRODUCTS.length; i++) {
    productRecords.push({
      name: HARDWARE_PRODUCTS[i],
      category: 'HARDWARE',
      isSubscription: false,
      quantityOnHand: randomInt(10, 500),
    });
  }
  // Additional hardware variants
  for (let i = 0; i < 50; i++) {
    productRecords.push({
      name: `${faker.commerce.productAdjective()} ${faker.commerce.product()} ${faker.string.alphanumeric(4).toUpperCase()}`,
      category: pick(['HARDWARE', 'NETWORKING', 'SECURITY']),
      isSubscription: false,
      quantityOnHand: randomInt(5, 300),
    });
  }

  // Service products (~80)
  for (let i = 0; i < SERVICE_PRODUCTS.length; i++) {
    productRecords.push({
      name: SERVICE_PRODUCTS[i],
      category: 'SERVICES',
      isSubscription: false,
      quantityOnHand: 9999,
    });
  }
  for (let i = 0; i < 40; i++) {
    productRecords.push({
      name: `${faker.company.buzzPhrase()} Service Package`,
      category: 'SERVICES',
      isSubscription: false,
      quantityOnHand: 9999,
    });
  }

  // Subscription products (~80)
  const intervals = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
  for (let i = 0; i < SUBSCRIPTION_PRODUCTS.length; i++) {
    productRecords.push({
      name: SUBSCRIPTION_PRODUCTS[i],
      category: 'SUBSCRIPTION',
      isSubscription: true,
      recurringInterval: pick(intervals),
      quantityOnHand: 9999,
    });
  }
  for (let i = 0; i < 40; i++) {
    productRecords.push({
      name: `${faker.company.buzzNoun()} Platform (${pick(intervals)})`,
      category: 'SUBSCRIPTION',
      isSubscription: true,
      recurringInterval: pick(intervals),
      quantityOnHand: 9999,
    });
  }

  // Software products (~30)
  for (let i = 0; i < 30; i++) {
    productRecords.push({
      name: `${faker.hacker.adjective()} ${faker.hacker.noun()} Software v${randomInt(1, 12)}.${randomInt(0, 9)}`,
      category: 'SOFTWARE',
      isSubscription: false,
      quantityOnHand: 9999,
    });
  }

  await prisma.product.createMany({ data: productRecords });
  const allProducts = await prisma.product.findMany();
  const hardwareProducts = allProducts.filter(p => ['HARDWARE', 'NETWORKING', 'SECURITY'].includes(p.category));
  const serviceProducts = allProducts.filter(p => p.category === 'SERVICES');
  const subscriptionProducts = allProducts.filter(p => p.isSubscription);
  console.log(`   ✅ ${allProducts.length} products created`);

  // ==========================================
  // 3b. PRODUCT PRICING — 300+
  // ==========================================
  console.log('💰 Creating product pricing...');
  const pricingData = [];
  for (const prod of allProducts) {
    // Base price (no tier)
    const basePrice = prod.category === 'SERVICES'
      ? randomDecimal(5000, 250000)
      : prod.isSubscription
        ? randomDecimal(29, 9999)
        : randomDecimal(500, 500000);

    pricingData.push({ productId: prod.id, price: basePrice });

    // Tier-specific prices (discounted)
    const tierCount = randomInt(1, tiers.length);
    const selectedTiers = pickN(tiers, tierCount);
    for (const tier of selectedTiers) {
      const discount = randomDecimal(0.85, 0.97);
      pricingData.push({
        productId: prod.id,
        customerTierId: tier.id,
        price: parseFloat((basePrice * discount).toFixed(2)),
      });
    }
  }
  // Batch insert in chunks to avoid memory issues
  const CHUNK = 500;
  for (let i = 0; i < pricingData.length; i += CHUNK) {
    await prisma.productPricing.createMany({ data: pricingData.slice(i, i + CHUNK) });
  }
  console.log(`   ✅ ${pricingData.length} pricing records created`);

  // ==========================================
  // 4. WAREHOUSES — 20
  // ==========================================
  console.log('🏭 Creating warehouses...');
  const warehouseData = WAREHOUSE_CITIES.map((city, i) => ({
    name: `${city} ${pick(WAREHOUSE_TYPES)}`,
    code: `W-${city.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    location: `${city}, Gujarat`,
  }));
  await prisma.warehouse.createMany({ data: warehouseData });
  const warehouses = await prisma.warehouse.findMany();
  console.log(`   ✅ ${warehouses.length} warehouses created`);

  // ==========================================
  // 5. INVENTORY — 350+
  // ==========================================
  console.log('📊 Creating inventory...');
  const inventoryData = [];
  const inventoryKeys = new Set();
  // Distribute physical products across warehouses
  const physicalProducts = allProducts.filter(p => !p.isSubscription && p.category !== 'SERVICES');
  for (const prod of physicalProducts) {
    const numWarehouses = randomInt(1, 5);
    const selectedWarehouses = pickN(warehouses, numWarehouses);
    for (const wh of selectedWarehouses) {
      const key = `${wh.id}-${prod.id}`;
      if (!inventoryKeys.has(key)) {
        inventoryKeys.add(key);
        inventoryData.push({
          warehouseId: wh.id,
          productId: prod.id,
          availableQuantity: randomInt(0, 200),
          reservedQuantity: randomInt(0, 30),
        });
      }
    }
  }
  for (let i = 0; i < inventoryData.length; i += CHUNK) {
    await prisma.inventory.createMany({ data: inventoryData.slice(i, i + CHUNK) });
  }
  console.log(`   ✅ ${inventoryData.length} inventory records created`);

  // ==========================================
  // 6. DISCOUNT RULES — 30+
  // ==========================================
  console.log('📏 Creating discount rules...');
  const discountRuleData = [];
  for (const cat of PRODUCT_CATEGORIES) {
    discountRuleData.push({
      appliedTo: 'CATEGORY',
      productCategory: cat,
      maxDiscountPercentage: randomDecimal(5, 20),
    });
  }
  for (const tier of tiers) {
    discountRuleData.push({
      appliedTo: 'TIER',
      targetTierId: tier.id,
      maxDiscountPercentage: randomDecimal(5, 18),
    });
  }
  // Additional category+amount combos
  for (let i = 0; i < 20; i++) {
    discountRuleData.push({
      appliedTo: pick(['CATEGORY', 'TIER']),
      productCategory: pick(['CATEGORY']).includes(pick(['CATEGORY'])) ? pick(PRODUCT_CATEGORIES) : null,
      targetTierId: Math.random() > 0.5 ? pick(tiers).id : null,
      maxDiscountPercentage: randomDecimal(3, 25),
    });
  }
  await prisma.discountRule.createMany({ data: discountRuleData });
  console.log(`   ✅ ${discountRuleData.length} discount rules created`);

  // ==========================================
  // 7. APPROVAL RULES — 12+
  // ==========================================
  console.log('✅ Creating approval rules...');
  const approvalRuleData = [
    { minRiskScore: 0, maxRiskScore: 15, requiredApproverLevel: 'SALES_REP', priority: 1 },
    { minRiskScore: 16, maxRiskScore: 30, requiredApproverLevel: 'SALES_REP', priority: 2 },
    { minRiskScore: 31, maxRiskScore: 45, requiredApproverLevel: 'SALES_MANAGER', priority: 3 },
    { minRiskScore: 46, maxRiskScore: 55, requiredApproverLevel: 'SALES_MANAGER', priority: 4 },
    { minRiskScore: 56, maxRiskScore: 65, requiredApproverLevel: 'FINANCE', priority: 5 },
    { minRiskScore: 66, maxRiskScore: 75, requiredApproverLevel: 'FINANCE', priority: 6 },
    { minRiskScore: 76, maxRiskScore: 85, requiredApproverLevel: 'ADMIN', priority: 7 },
    { minRiskScore: 86, maxRiskScore: 95, requiredApproverLevel: 'ADMIN', priority: 8 },
    { minRiskScore: 96, maxRiskScore: 100, requiredApproverLevel: 'ADMIN', priority: 9 },
  ];
  await prisma.approvalRule.createMany({ data: approvalRuleData });
  console.log(`   ✅ ${approvalRuleData.length} approval rules created`);

  // ==========================================
  // 8. QUOTATIONS — 350+ with versions, items, approvals, messages
  // ==========================================
  console.log('📋 Creating quotations (this takes a moment)...');
  const quotationIds = [];
  const confirmedQuotationIds = [];
  let qtNum = 1001;

  // Weighted status distribution for realism
  const statusWeights = [
    { status: 'DRAFT', weight: 50 },
    { status: 'PENDING_APPROVAL', weight: 40 },
    { status: 'APPROVED', weight: 30 },
    { status: 'REJECTED', weight: 20 },
    { status: 'NEGOTIATION', weight: 30 },
    { status: 'SENT', weight: 40 },
    { status: 'CONFIRMED', weight: 60 },
    { status: 'CONVERTED', weight: 20 },
    { status: 'CANCELLED', weight: 15 },
  ];
  const weightedStatuses = [];
  for (const sw of statusWeights) {
    for (let i = 0; i < sw.weight; i++) weightedStatuses.push(sw.status);
  }

  // Create quotations in batches
  const QUOTE_BATCH = 25;
  const TOTAL_QUOTES = 350;

  for (let batch = 0; batch < Math.ceil(TOTAL_QUOTES / QUOTE_BATCH); batch++) {
    const batchSize = Math.min(QUOTE_BATCH, TOTAL_QUOTES - batch * QUOTE_BATCH);
    const promises = [];

    for (let i = 0; i < batchSize; i++) {
      const status = pick(weightedStatuses);
      const customer = pick(customerUsers);
      const rep = pick(salesReps);
      const numItems = randomInt(1, 6);
      const selectedProducts = pickN(allProducts, numItems);
      const riskScore = randomInt(0, 100);

      let totalAmount = 0;
      let totalDiscount = 0;
      const itemsData = selectedProducts.map(prod => {
        const qty = randomInt(1, 50);
        const unitPrice = prod.isSubscription
          ? randomDecimal(29, 5000)
          : prod.category === 'SERVICES'
            ? randomDecimal(5000, 150000)
            : randomDecimal(500, 200000);
        const discPct = randomDecimal(0, 15);
        const lineTotal = qty * unitPrice * (1 - discPct / 100);
        totalAmount += lineTotal;
        totalDiscount += qty * unitPrice * discPct / 100;
        return { productId: prod.id, quantity: qty, unitPrice, discountPercentage: discPct };
      });

      totalAmount = parseFloat(totalAmount.toFixed(2));
      totalDiscount = parseFloat(totalDiscount.toFixed(2));

      const quotationNumber = `QT-2026-${qtNum++}`;
      const createdAt = randomDate(180, 1);

      // Build version data with optional approvals and messages
      const versionData = {
        versionNumber: 1,
        createdById: rep.id,
        totalAmount,
        totalDiscount,
        riskScore,
        internalNotes: Math.random() > 0.6 ? faker.lorem.sentence() : null,
        items: { create: itemsData },
        createdAt,
      };

      // Add approval requests for PENDING_APPROVAL and above
      if (['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(status)) {
        const approvalStatus = status === 'PENDING_APPROVAL' ? 'PENDING'
          : status === 'APPROVED' ? 'APPROVED'
          : 'REJECTED';
        versionData.approvals = {
          create: [{
            assignedRole: riskScore > 75 ? 'ADMIN' : riskScore > 50 ? 'FINANCE' : 'SALES_MANAGER',
            status: approvalStatus,
            actionedById: approvalStatus !== 'PENDING' ? pick(managers).id : null,
            comments: faker.lorem.sentence(),
          }],
        };
      }

      // Add negotiation messages for NEGOTIATION status
      if (status === 'NEGOTIATION') {
        const msgCount = randomInt(2, 6);
        const msgs = [];
        for (let m = 0; m < msgCount; m++) {
          msgs.push({
            authorId: m % 2 === 0 ? rep.id : customer.id,
            senderRole: m % 2 === 0 ? 'SALES_REP' : 'CUSTOMER',
            content: faker.lorem.sentences(randomInt(1, 3)),
            proposedDiscount: Math.random() > 0.5 ? randomDecimal(2, 18) : null,
            isCommercialChange: Math.random() > 0.7,
            createdAt: new Date(createdAt.getTime() + m * 3600000),
          });
        }
        versionData.messages = { create: msgs };
      }

      const p = prisma.quotation.create({
        data: {
          quotationNumber,
          customerId: customer.id,
          salesRepId: rep.id,
          status,
          createdAt,
          versions: { create: [versionData] },
        },
        include: { versions: true },
      }).then(async (q) => {
        await prisma.quotation.update({
          where: { id: q.id },
          data: { activeVersionId: q.versions[0].id },
        });
        quotationIds.push({ id: q.id, status, customerId: customer.id, totalAmount, version: q.versions[0] });
        if (status === 'CONFIRMED' || status === 'CONVERTED') {
          confirmedQuotationIds.push({ id: q.id, customerId: customer.id, totalAmount, version: q.versions[0] });
        }
      });

      promises.push(p);
    }

    await Promise.all(promises);
    process.stdout.write(`   📋 Quotations: ${Math.min((batch + 1) * QUOTE_BATCH, TOTAL_QUOTES)}/${TOTAL_QUOTES}\r`);
  }
  console.log(`\n   ✅ ${quotationIds.length} quotations created (with versions, items, approvals, messages)`);

  // ==========================================
  // 9. ORDERS — 300+ from confirmed/converted quotations
  // ==========================================
  console.log('📦 Creating orders...');

  // We need more confirmed quotations for 300 orders, so create additional ones
  while (confirmedQuotationIds.length < 320) {
    const customer = pick(customerUsers);
    const rep = pick(salesReps);
    const numItems = randomInt(1, 5);
    const selectedProducts = pickN(allProducts, numItems);

    let totalAmount = 0;
    let totalDiscount = 0;
    const itemsData = selectedProducts.map(prod => {
      const qty = randomInt(1, 30);
      const unitPrice = prod.isSubscription
        ? randomDecimal(29, 5000)
        : prod.category === 'SERVICES'
          ? randomDecimal(5000, 150000)
          : randomDecimal(500, 200000);
      const discPct = randomDecimal(0, 12);
      totalAmount += qty * unitPrice * (1 - discPct / 100);
      totalDiscount += qty * unitPrice * discPct / 100;
      return { productId: prod.id, quantity: qty, unitPrice, discountPercentage: discPct };
    });

    totalAmount = parseFloat(totalAmount.toFixed(2));
    totalDiscount = parseFloat(totalDiscount.toFixed(2));

    const q = await prisma.quotation.create({
      data: {
        quotationNumber: `QT-2026-${qtNum++}`,
        customerId: customer.id,
        salesRepId: rep.id,
        status: 'CONFIRMED',
        createdAt: randomDate(120, 1),
        versions: {
          create: [{
            versionNumber: 1,
            createdById: rep.id,
            totalAmount,
            totalDiscount,
            riskScore: randomInt(0, 40),
            items: { create: itemsData },
          }],
        },
      },
      include: { versions: true },
    });
    await prisma.quotation.update({
      where: { id: q.id },
      data: { activeVersionId: q.versions[0].id },
    });
    confirmedQuotationIds.push({ id: q.id, customerId: customer.id, totalAmount, version: q.versions[0] });
  }

  // Now create orders
  const orders = [];
  let ordNum = 1001;
  const ORDER_BATCH = 20;
  for (let batch = 0; batch < Math.ceil(confirmedQuotationIds.length / ORDER_BATCH); batch++) {
    const slice = confirmedQuotationIds.slice(batch * ORDER_BATCH, (batch + 1) * ORDER_BATCH);
    const promises = slice.map(async (qt) => {
      // Get quotation items for this version
      const versionItems = await prisma.quotationItem.findMany({
        where: { quotationVersionId: qt.version.id },
        include: { quotationVersion: { include: { quotation: true } } },
      });

      const orderItemsData = [];
      for (const item of versionItems) {
        const prod = allProducts.find(p => p.id === item.productId);
        orderItemsData.push({
          productId: item.productId,
          snapshotName: prod ? prod.name : `Product ${item.productId.substring(0, 8)}`,
          quantity: item.quantity,
          snapshotUnitPrice: parseFloat(item.unitPrice.toString()),
          snapshotDiscount: parseFloat(item.discountPercentage.toString()),
          isSubscription: prod ? prod.isSubscription : false,
        });
      }

      if (orderItemsData.length === 0) {
        // Fallback: create at least one item
        const prod = pick(allProducts);
        orderItemsData.push({
          productId: prod.id,
          snapshotName: prod.name,
          quantity: randomInt(1, 10),
          snapshotUnitPrice: randomDecimal(1000, 100000),
          snapshotDiscount: randomDecimal(0, 10),
          isSubscription: prod.isSubscription,
        });
      }

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${ordNum++}`,
          quotationId: qt.id,
          customerId: qt.customerId,
          status: pick(ORDER_STATUSES),
          totalAmount: qt.totalAmount,
          createdAt: randomDate(90, 0),
          items: { create: orderItemsData },
        },
      });
      orders.push(order);
    });

    await Promise.all(promises);
    process.stdout.write(`   📦 Orders: ${Math.min((batch + 1) * ORDER_BATCH, confirmedQuotationIds.length)}/${confirmedQuotationIds.length}\r`);
  }
  console.log(`\n   ✅ ${orders.length} orders created (with order items)`);

  // ==========================================
  // 10. INVOICES — 350+
  // ==========================================
  console.log('🧾 Creating invoices...');
  const invoices = [];
  let invNum = 2001;

  for (const order of orders) {
    // 1-2 invoices per order
    const numInvoices = randomInt(1, 2);
    for (let i = 0; i < numInvoices; i++) {
      const splitAmount = numInvoices === 1
        ? parseFloat(order.totalAmount.toString())
        : parseFloat((parseFloat(order.totalAmount.toString()) * (i === 0 ? 0.6 : 0.4)).toFixed(2));
      const taxAmount = parseFloat((splitAmount * 0.18).toFixed(2));
      const status = pick(INVOICE_STATUSES);

      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-${invNum++}`,
          orderId: order.id,
          customerId: order.customerId,
          status,
          dueDate: daysFromNow(randomInt(-30, 60)),
          totalAmount: splitAmount,
          taxAmount,
          createdAt: randomDate(60, 0),
        },
      });
      invoices.push({ ...inv, status });
    }
  }
  console.log(`   ✅ ${invoices.length} invoices created`);

  // ==========================================
  // 11. PAYMENTS — 300+
  // ==========================================
  console.log('💳 Creating payments...');
  const paymentData = [];
  const paidInvoices = invoices.filter(inv => ['PAID', 'PARTIAL'].includes(inv.status));
  // Also add some payments to SENT invoices
  const sentInvoices = invoices.filter(inv => inv.status === 'SENT').slice(0, 50);
  const payableInvoices = [...paidInvoices, ...sentInvoices];

  for (const inv of payableInvoices) {
    const numPayments = inv.status === 'PARTIAL' ? randomInt(1, 2) : 1;
    const totalAmt = parseFloat(inv.totalAmount.toString());
    for (let i = 0; i < numPayments; i++) {
      const payAmt = numPayments === 1 ? totalAmt : parseFloat((totalAmt * (i === 0 ? 0.5 : 0.5)).toFixed(2));
      paymentData.push({
        invoiceId: inv.id,
        amount: payAmt,
        paymentMethod: pick(PAYMENT_METHODS),
        reference: `PAY-${faker.string.alphanumeric(10).toUpperCase()}`,
        paidAt: randomDate(30, 0),
      });
    }
  }

  // Add more payments to reach 300+
  while (paymentData.length < 320) {
    const inv = pick(invoices);
    paymentData.push({
      invoiceId: inv.id,
      amount: randomDecimal(1000, 50000),
      paymentMethod: pick(PAYMENT_METHODS),
      reference: `PAY-${faker.string.alphanumeric(10).toUpperCase()}`,
      paidAt: randomDate(60, 0),
    });
  }

  for (let i = 0; i < paymentData.length; i += CHUNK) {
    await prisma.payment.createMany({ data: paymentData.slice(i, i + CHUNK) });
  }
  console.log(`   ✅ ${paymentData.length} payments created`);

  // ==========================================
  // 12. SUBSCRIPTIONS — 300+
  // ==========================================
  console.log('🔄 Creating subscriptions...');
  const subscriptionData = [];
  const ordersWithSubs = orders.filter(() => Math.random() > 0.3);

  for (const order of ordersWithSubs) {
    subscriptionData.push({
      orderId: order.id,
      customerId: order.customerId,
      interval: pick(intervals),
      status: pick(SUBSCRIPTION_STATUSES),
      nextBillingDate: daysFromNow(randomInt(1, 90)),
      createdAt: randomDate(60, 0),
    });
  }

  // Ensure we have 300+
  while (subscriptionData.length < 320) {
    const order = pick(orders);
    subscriptionData.push({
      orderId: order.id,
      customerId: order.customerId,
      interval: pick(intervals),
      status: pick(SUBSCRIPTION_STATUSES),
      nextBillingDate: daysFromNow(randomInt(1, 180)),
      createdAt: randomDate(90, 0),
    });
  }

  for (let i = 0; i < subscriptionData.length; i += CHUNK) {
    await prisma.subscription.createMany({ data: subscriptionData.slice(i, i + CHUNK) });
  }
  console.log(`   ✅ ${subscriptionData.length} subscriptions created`);

  // ==========================================
  // 13. FULFILLMENT PLANS — 300+ with items
  // ==========================================
  console.log('🚚 Creating fulfillment plans...');
  const fulfillmentModes = ['LOWEST_COST', 'MIN_SHIPMENTS', 'BALANCED'];
  const ordersForFulfillment = orders.filter(o => !['CANCELLED'].includes(o.status));
  const fulfillmentOrders = ordersForFulfillment.slice(0, 320);
  let ffCount = 0;

  for (let batch = 0; batch < Math.ceil(fulfillmentOrders.length / ORDER_BATCH); batch++) {
    const slice = fulfillmentOrders.slice(batch * ORDER_BATCH, (batch + 1) * ORDER_BATCH);
    const promises = slice.map(async (order) => {
      // Get order items
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      if (orderItems.length === 0) return;

      const ffItems = orderItems
        .filter(oi => !oi.isSubscription)
        .slice(0, 4)
        .map(oi => ({
          productId: oi.productId,
          warehouseId: pick(warehouses).id,
          quantity: oi.quantity,
          status: pick(FULFILLMENT_STATUSES),
          estimatedDelivery: daysFromNow(randomInt(1, 14)),
        }));

      if (ffItems.length === 0) {
        ffItems.push({
          productId: pick(hardwareProducts).id,
          warehouseId: pick(warehouses).id,
          quantity: randomInt(1, 10),
          status: pick(FULFILLMENT_STATUSES),
          estimatedDelivery: daysFromNow(randomInt(1, 14)),
        });
      }

      try {
        await prisma.fulfillmentPlan.create({
          data: {
            orderId: order.id,
            optimizationMode: pick(fulfillmentModes),
            totalCost: randomDecimal(500, 15000),
            shipmentCount: randomInt(1, 5),
            estimatedDelivery: daysFromNow(randomInt(3, 21)),
            items: { create: ffItems },
          },
        });
        ffCount++;
      } catch (e) {
        // Skip duplicate orderId (unique constraint)
      }
    });
    await Promise.all(promises);
    process.stdout.write(`   🚚 Fulfillments: ${Math.min((batch + 1) * ORDER_BATCH, fulfillmentOrders.length)}/${fulfillmentOrders.length}\r`);
  }
  console.log(`\n   ✅ ${ffCount} fulfillment plans created (with items)`);

  // ==========================================
  // 14. AUDIT LOGS — 400+
  // ==========================================
  console.log('📝 Creating audit logs...');
  const auditLogData = [];
  const allEntityIds = [
    ...quotationIds.map(q => ({ type: 'QUOTATION', id: q.id })),
    ...orders.map(o => ({ type: 'ORDER', id: o.id })),
    ...invoices.map(i => ({ type: 'INVOICE', id: i.id })),
  ];

  for (let i = 0; i < 400; i++) {
    const entity = pick(allEntityIds);
    const actor = pick(staffUsers);
    auditLogData.push({
      actorId: actor.id,
      entityType: entity ? entity.type : pick(ENTITY_TYPES),
      entityId: entity ? entity.id : faker.string.uuid(),
      action: pick(AUDIT_ACTIONS),
      oldData: Math.random() > 0.3 ? { status: pick(QUOTATION_STATUSES), updatedBy: faker.person.fullName() } : null,
      newData: { status: pick(QUOTATION_STATUSES), updatedBy: faker.person.fullName(), timestamp: new Date().toISOString() },
      timestamp: randomDate(180, 0),
    });
  }

  for (let i = 0; i < auditLogData.length; i += CHUNK) {
    await prisma.auditLog.createMany({ data: auditLogData.slice(i, i + CHUNK) });
  }
  console.log(`   ✅ ${auditLogData.length} audit logs created`);

  // ==========================================
  // 15. OUTBOX EVENTS — 350+
  // ==========================================
  console.log('📤 Creating outbox events...');
  const outboxData = [];
  const outboxStatuses = ['PENDING', 'PUBLISHED', 'FAILED'];

  for (let i = 0; i < 350; i++) {
    const entity = allEntityIds.length > 0 ? pick(allEntityIds) : null;
    outboxData.push({
      eventType: pick(EVENT_TYPES),
      aggregateType: entity ? entity.type : pick(ENTITY_TYPES),
      aggregateId: entity ? entity.id : faker.string.uuid(),
      payload: {
        action: pick(AUDIT_ACTIONS),
        data: { id: faker.string.uuid(), amount: randomDecimal(100, 500000), status: pick(QUOTATION_STATUSES) },
        metadata: { source: 'bulk-seed', version: '1.0' },
      },
      status: pick(outboxStatuses),
      attempts: randomInt(0, 5),
      lastError: Math.random() > 0.8 ? faker.lorem.sentence() : null,
      createdAt: randomDate(90, 0),
      publishedAt: Math.random() > 0.4 ? randomDate(30, 0) : null,
    });
  }

  for (let i = 0; i < outboxData.length; i += CHUNK) {
    await prisma.outboxEvent.createMany({ data: outboxData.slice(i, i + CHUNK) });
  }
  console.log(`   ✅ ${outboxData.length} outbox events created`);

  // ==========================================
  // SUMMARY
  // ==========================================
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Count actuals from DB
  const counts = {
    users: await prisma.user.count(),
    tiers: await prisma.customerTier.count(),
    products: await prisma.product.count(),
    pricing: await prisma.productPricing.count(),
    warehouses: await prisma.warehouse.count(),
    inventory: await prisma.inventory.count(),
    discountRules: await prisma.discountRule.count(),
    approvalRules: await prisma.approvalRule.count(),
    quotations: await prisma.quotation.count(),
    versions: await prisma.quotationVersion.count(),
    quotationItems: await prisma.quotationItem.count(),
    approvalRequests: await prisma.approvalRequest.count(),
    negotiationMsgs: await prisma.negotiationMessage.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    subscriptions: await prisma.subscription.count(),
    fulfillmentPlans: await prisma.fulfillmentPlan.count(),
    fulfillmentItems: await prisma.fulfillmentItem.count(),
    auditLogs: await prisma.auditLog.count(),
    outboxEvents: await prisma.outboxEvent.count(),
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log(`\n${'═'.repeat(56)}`);
  console.log('  ✅  DealFlow360 BULK Seeding Complete!');
  console.log(`${'═'.repeat(56)}`);
  console.log(`  ⏱  Time elapsed: ${elapsed}s`);
  console.log(`  📊 Total records: ${total.toLocaleString()}`);
  console.log(`${'─'.repeat(56)}`);
  console.log(`  👤 Users:                ${String(counts.users).padStart(6)}`);
  console.log(`  🏷️  Customer Tiers:       ${String(counts.tiers).padStart(6)}`);
  console.log(`  📦 Products:             ${String(counts.products).padStart(6)}`);
  console.log(`  💰 Product Pricing:      ${String(counts.pricing).padStart(6)}`);
  console.log(`  🏭 Warehouses:           ${String(counts.warehouses).padStart(6)}`);
  console.log(`  📊 Inventory:            ${String(counts.inventory).padStart(6)}`);
  console.log(`  📏 Discount Rules:       ${String(counts.discountRules).padStart(6)}`);
  console.log(`  ✅ Approval Rules:       ${String(counts.approvalRules).padStart(6)}`);
  console.log(`  📋 Quotations:           ${String(counts.quotations).padStart(6)}`);
  console.log(`  📄 Quotation Versions:   ${String(counts.versions).padStart(6)}`);
  console.log(`  📝 Quotation Items:      ${String(counts.quotationItems).padStart(6)}`);
  console.log(`  🔍 Approval Requests:    ${String(counts.approvalRequests).padStart(6)}`);
  console.log(`  💬 Negotiation Messages: ${String(counts.negotiationMsgs).padStart(6)}`);
  console.log(`  📦 Orders:               ${String(counts.orders).padStart(6)}`);
  console.log(`  📋 Order Items:          ${String(counts.orderItems).padStart(6)}`);
  console.log(`  🧾 Invoices:             ${String(counts.invoices).padStart(6)}`);
  console.log(`  💳 Payments:             ${String(counts.payments).padStart(6)}`);
  console.log(`  🔄 Subscriptions:        ${String(counts.subscriptions).padStart(6)}`);
  console.log(`  🚚 Fulfillment Plans:    ${String(counts.fulfillmentPlans).padStart(6)}`);
  console.log(`  📦 Fulfillment Items:    ${String(counts.fulfillmentItems).padStart(6)}`);
  console.log(`  📝 Audit Logs:           ${String(counts.auditLogs).padStart(6)}`);
  console.log(`  📤 Outbox Events:        ${String(counts.outboxEvents).padStart(6)}`);
  console.log(`${'─'.repeat(56)}`);
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
  console.log(`${'═'.repeat(56)}\n`);
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
