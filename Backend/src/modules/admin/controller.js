import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendSuccess } from '../../utils/response.js';

const prisma = new PrismaClient();

// -- Products --
export const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ 
      include: { pricing: true, inventory: { include: { warehouse: true } } },
      orderBy: { createdAt: 'desc' }
    });
    sendSuccess(res, 200, 'Products fetched successfully', products);
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const { 
      name, 
      category, 
      isSubscription, 
      recurringInterval, 
      quantityOnHand, 
      variantAttributes,
      price,
      pricing,
      warehouseStock
    } = req.body;

    const basePrice = price !== undefined ? Number(price) : (pricing?.[0]?.price !== undefined ? Number(pricing[0].price) : 0);
    const isSub = isSubscription === true || isSubscription === 'true';
    let qty = parseInt(quantityOnHand, 10) || 0;

    if (Array.isArray(warehouseStock) && warehouseStock.length > 0) {
      const sum = warehouseStock.reduce((acc, item) => acc + (Math.max(0, parseInt(item.quantity, 10) || 0)), 0);
      if (sum > 0 || qty === 0) {
        qty = sum;
      }
    }

    const product = await prisma.product.create({
      data: { 
        name, 
        category: category || 'Hardware', 
        isSubscription: isSub, 
        recurringInterval: isSub ? (recurringInterval || 'Monthly') : null, 
        quantityOnHand: qty, 
        variantAttributes: variantAttributes || null,
        pricing: {
          create: [
            { price: isNaN(basePrice) ? 0 : basePrice }
          ]
        }
      },
      include: {
        pricing: true
      }
    });

    // If warehouseStock is provided, create inventory records
    if (Array.isArray(warehouseStock) && warehouseStock.length > 0) {
      for (const item of warehouseStock) {
        if (!item.warehouseId) continue;
        const whQty = Math.max(0, parseInt(item.quantity, 10) || 0);
        await prisma.inventory.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: item.warehouseId,
              productId: product.id
            }
          },
          update: {
            availableQuantity: whQty
          },
          create: {
            warehouseId: item.warehouseId,
            productId: product.id,
            availableQuantity: whQty,
            reservedQuantity: 0
          }
        });
      }
    }

    const created = await prisma.product.findUnique({
      where: { id: product.id },
      include: { pricing: true, inventory: { include: { warehouse: true } } }
    });

    sendSuccess(res, 201, 'Product created successfully', created);
  } catch (err) { next(err); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      category, 
      isSubscription, 
      recurringInterval, 
      quantityOnHand, 
      variantAttributes,
      price,
      pricing,
      warehouseStock
    } = req.body;

    const rawPrice = price !== undefined ? price : pricing?.[0]?.price;
    const basePrice = rawPrice !== undefined ? Number(rawPrice) : undefined;
    const isSub = isSubscription !== undefined ? (isSubscription === true || isSubscription === 'true') : undefined;
    let qty = quantityOnHand !== undefined ? (parseInt(quantityOnHand, 10) || 0) : undefined;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (isSub !== undefined) updateData.isSubscription = isSub;
    if (recurringInterval !== undefined) updateData.recurringInterval = isSub ? recurringInterval : null;
    if (variantAttributes !== undefined) updateData.variantAttributes = variantAttributes;

    // Handle warehouseStock
    if (Array.isArray(warehouseStock)) {
      for (const item of warehouseStock) {
        if (!item.warehouseId) continue;
        const whQty = Math.max(0, parseInt(item.quantity, 10) || 0);
        await prisma.inventory.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: item.warehouseId,
              productId: id
            }
          },
          update: {
            availableQuantity: whQty
          },
          create: {
            warehouseId: item.warehouseId,
            productId: id,
            availableQuantity: whQty,
            reservedQuantity: 0
          }
        });
      }

      const totalStock = await prisma.inventory.aggregate({
        where: { productId: id },
        _sum: { availableQuantity: true }
      });
      qty = totalStock._sum.availableQuantity || 0;
    }

    if (qty !== undefined) updateData.quantityOnHand = qty;

    // Update product core fields
    await prisma.product.update({
      where: { id },
      data: updateData
    });

    // Update base price
    if (basePrice !== undefined && !isNaN(basePrice)) {
      const existingPricing = await prisma.productPricing.findFirst({
        where: { productId: id, customerTierId: null }
      });
      if (existingPricing) {
        await prisma.productPricing.update({
          where: { id: existingPricing.id },
          data: { price: basePrice }
        });
      } else {
        await prisma.productPricing.create({
          data: { productId: id, price: basePrice }
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { pricing: true, inventory: { include: { warehouse: true } } }
    });

    sendSuccess(res, 200, 'Product updated successfully', updated);
  } catch (err) { next(err); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.productPricing.deleteMany({ where: { productId: id } });
    await prisma.inventory.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    sendSuccess(res, 200, 'Product deleted successfully');
  } catch (err) { next(err); }
};

// -- Customer Tiers --
export const getCustomerTiers = async (req, res, next) => {
  try {
    let tiers = await prisma.customerTier.findMany({ orderBy: { name: 'asc' } });
    if (tiers.length === 0) {
      const defaultTiers = [
        { name: 'Enterprise Tier', description: 'Large Enterprise Accounts (₹5,00,000+ pipeline)' },
        { name: 'Gold Tier', description: 'Mid-Market Strategic Accounts (₹1,00,000 - ₹5,00,000)' },
        { name: 'Silver Tier', description: 'Standard Business Accounts (₹0 - ₹1,00,000)' },
        { name: 'Bronze Tier', description: 'Starter SMB Accounts' }
      ];
      for (const t of defaultTiers) {
        await prisma.customerTier.create({ data: t });
      }
      tiers = await prisma.customerTier.findMany({ orderBy: { name: 'asc' } });
    }
    sendSuccess(res, 200, 'Customer Tiers fetched', tiers);
  } catch (err) { next(err); }
};

export const createCustomerTier = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const tier = await prisma.customerTier.create({ data: { name, description } });
    sendSuccess(res, 201, 'Customer Tier created', tier);
  } catch (err) { next(err); }
};

// -- Product Pricing (Price Lists) --
export const getProductPricing = async (req, res, next) => {
  try {
    const pricing = await prisma.productPricing.findMany({ include: { product: true, customerTier: true } });
    sendSuccess(res, 200, 'Pricing fetched', pricing);
  } catch (err) { next(err); }
};

export const createProductPricing = async (req, res, next) => {
  try {
    const { productId, customerTierId, price } = req.body;
    const pricing = await prisma.productPricing.create({ data: { productId, customerTierId, price } });
    sendSuccess(res, 201, 'Pricing created', pricing);
  } catch (err) { next(err); }
};

// -- Discount Rules --
export const getDiscountRules = async (req, res, next) => {
  try {
    let rules = await prisma.discountRule.findMany({ include: { targetTier: true }, orderBy: { maxDiscountPercentage: 'asc' } });
    sendSuccess(res, 200, 'Discount rules fetched', rules);
  } catch (err) { next(err); }
};

export const createDiscountRule = async (req, res, next) => {
  try {
    const { appliedTo, targetTierId, productCategory, maxDiscountPercentage } = req.body;
    let validTierId = targetTierId;
    if (appliedTo === 'TIER' && targetTierId) {
      const exists = await prisma.customerTier.findUnique({ where: { id: targetTierId } });
      if (!exists) {
        const firstTier = await prisma.customerTier.findFirst();
        validTierId = firstTier ? firstTier.id : null;
      }
    }
    const rule = await prisma.discountRule.create({ 
      data: { 
        appliedTo, 
        targetTierId: appliedTo === 'TIER' ? validTierId : null, 
        productCategory: appliedTo === 'CATEGORY' ? productCategory : null, 
        maxDiscountPercentage: parseFloat(maxDiscountPercentage) || 0 
      },
      include: { targetTier: true }
    });
    sendSuccess(res, 201, 'Discount rule created', rule);
  } catch (err) { next(err); }
};

export const deleteDiscountRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.discountRule.delete({ where: { id } });
    sendSuccess(res, 200, 'Discount rule deleted successfully');
  } catch (err) { next(err); }
};

// -- Approval Rules --
export const getApprovalRules = async (req, res, next) => {
  try {
    let rules = await prisma.approvalRule.findMany({
      orderBy: { minRiskScore: 'asc' }
    });
    sendSuccess(res, 200, 'Approval rules fetched', rules);
  } catch (err) { next(err); }
};

export const createApprovalRule = async (req, res, next) => {
  try {
    const { minRiskScore, maxRiskScore, requiredApproverLevel, priority } = req.body;
    const rule = await prisma.approvalRule.create({ 
      data: { 
        minRiskScore: parseInt(minRiskScore, 10) || 0, 
        maxRiskScore: parseInt(maxRiskScore, 10) || 100, 
        requiredApproverLevel: requiredApproverLevel || 'SALES_MANAGER',
        priority: parseInt(priority, 10) || 0
      } 
    });
    sendSuccess(res, 201, 'Approval rule created', rule);
  } catch (err) { next(err); }
};

export const deleteApprovalRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.approvalRule.delete({ where: { id } });
    sendSuccess(res, 200, 'Approval rule deleted successfully');
  } catch (err) { next(err); }
};

// -- Warehouses & Multi-Hub Optimization --
export const getWarehouses = async (req, res, next) => {
  try {
    let warehouses = await prisma.warehouse.findMany({
      include: { inventory: { include: { product: true } } }
    });

    // If empty seed warehouses for demo/configuration
    if (warehouses.length === 0) {
      const defaultHubs = [
        { code: 'WH-AHM-01', name: 'Ahmedabad Central Hub', location: 'Ahmedabad, Gujarat' },
        { code: 'WH-AND-02', name: 'Anand Regional Depot', location: 'Anand, Gujarat' },
        { code: 'WH-GNR-03', name: 'Gandhinagar Express Hub', location: 'Gandhinagar, Gujarat' },
        { code: 'WH-SRT-04', name: 'Surat Distribution Center', location: 'Surat, Gujarat' }
      ];

      for (const hub of defaultHubs) {
        await prisma.warehouse.upsert({
          where: { code: hub.code },
          update: {},
          create: hub
        });
      }

      warehouses = await prisma.warehouse.findMany({
        include: { inventory: { include: { product: true } } }
      });
    }

    sendSuccess(res, 200, 'Warehouses fetched successfully', warehouses);
  } catch (err) { next(err); }
};

export const createWarehouse = async (req, res, next) => {
  try {
    const { code, name, location } = req.body;
    const warehouse = await prisma.warehouse.create({
      data: { code, name, location }
    });
    sendSuccess(res, 201, 'Warehouse created successfully', warehouse);
  } catch (err) { next(err); }
};

export const updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (location !== undefined) data.location = location;
    const warehouse = await prisma.warehouse.update({ where: { id }, data });
    sendSuccess(res, 200, 'Warehouse updated successfully', warehouse);
  } catch (err) { next(err); }
};

export const deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.inventory.deleteMany({ where: { warehouseId: id } });
    await prisma.fulfillmentItem.updateMany({
      where: { warehouseId: id },
      data: { warehouseId: null }
    });
    await prisma.warehouse.delete({ where: { id } });
    sendSuccess(res, 200, 'Warehouse deleted successfully');
  } catch (err) { next(err); }
};



// -- Customers Directory --
export const getCustomers = async (req, res, next) => {
  try {
    // 1. Fetch registered customer accounts
    const customerUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch customer tiers and their discount rules
    const customerTiers = await prisma.customerTier.findMany({
      include: {
        discountRules: true
      }
    });

    // Create a lookup map for tier discount limits
    const tierLimitMap = {};
    customerTiers.forEach(t => {
      const tierRule = t.discountRules.find(r => r.appliedTo === 'TIER');
      tierLimitMap[t.name.toUpperCase()] = tierRule ? Number(tierRule.maxDiscountPercentage) : (t.name.toUpperCase().includes('ENTERPRISE') ? 15 : t.name.toUpperCase().includes('GOLD') ? 12 : 10);
    });

    // 3. Fetch quotations to aggregate pipeline metrics
    const quotations = await prisma.quotation.findMany({
      include: {
        activeVersion: true
      }
    });

    // Contact name map for well-known accounts
    const knownContacts = {
      'TechCorp Solutions': 'Priya Sharma (VP Technology)',
      'Nexus FinTech Ltd': 'Rahul Mehta (Head of IT)',
      'Global Logistics Hub': 'Amit Patel (Operations Director)',
      'Acme Corporation': 'John Acme (Procurement Lead)',
      'Stark Industries': 'Pepper Potts (COO)'
    };

    // 4. Map customer users into full commercial profiles
    const customerList = customerUsers.map(user => {
      const userQuotes = quotations.filter(q => q.customerId === user.id);
      const pipelineValue = userQuotes.reduce((sum, q) => sum + Number(q.activeVersion?.totalAmount || 0), 0);
      const avgRisk = userQuotes.length > 0
        ? Math.round(userQuotes.reduce((sum, q) => sum + (q.activeVersion?.riskScore || 0), 0) / userQuotes.length)
        : 0;

      // Determine customer tier based on enterprise name or pipeline value
      let tier = 'STANDARD';
      const upperName = user.name.toUpperCase();
      if (upperName.includes('TECHCORP') || upperName.includes('STARK') || upperName.includes('ACME') || pipelineValue >= 500000) {
        tier = 'ENTERPRISE';
      } else if (upperName.includes('NEXUS') || pipelineValue >= 100000) {
        tier = 'GOLD';
      }

      const discountLimit = tierLimitMap[tier] || (tier === 'ENTERPRISE' ? 15 : tier === 'GOLD' ? 12 : 10);

      // Clean company display name
      const isCompany = upperName.includes('CORP') || upperName.includes('LTD') || upperName.includes('SOLUTIONS') || upperName.includes('INDUSTRIES') || upperName.includes('HUB');
      const companyName = isCompany ? user.name : `${user.name} Corporation`;
      const contactName = knownContacts[user.name] || user.name;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        companyName,
        tier,
        tierDiscountLimit: discountLimit,
        contactName,
        contact: contactName,
        activeQuotesCount: userQuotes.length,
        pipelineValue,
        lastActivity: userQuotes.length > 0 ? 'Active Deals' : 'Registered Account',
        riskScore: avgRisk,
        riskLevel: avgRisk > 60 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW',
        isActive: user.isActive,
        createdAt: user.createdAt
      };
    });

    sendSuccess(res, 200, 'Customers fetched successfully', customerList);
  } catch (err) { next(err); }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Customer name and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    const customer = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'CUSTOMER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        entityType: 'CUSTOMER',
        entityId: customer.id,
        action: 'CREATED',
        newData: { name: customer.name, email: customer.email, role: customer.role }
      }
    }).catch(() => {});

    sendSuccess(res, 201, 'Customer account created successfully', customer);
  } catch (err) { next(err); }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, isActive } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existing.email) {
        const emailConflict = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (emailConflict) {
          return res.status(400).json({ success: false, message: 'Email address is already in use by another user' });
        }
      }
      data.email = cleanEmail;
    }
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        entityType: 'CUSTOMER',
        entityId: id,
        action: 'UPDATED',
        oldData: { name: existing.name, email: existing.email, isActive: existing.isActive },
        newData: { name: updated.name, email: updated.email, isActive: updated.isActive }
      }
    }).catch(() => {});

    sendSuccess(res, 200, 'Customer details updated successfully', updated);
  } catch (err) { next(err); }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    // Check for linked transactions
    const [quotesCount, ordersCount, invoicesCount] = await Promise.all([
      prisma.quotation.count({ where: { customerId: id } }),
      prisma.order.count({ where: { customerId: id } }),
      prisma.invoice.count({ where: { customerId: id } })
    ]);

    let actionTaken = 'deleted';
    let message = 'Customer account deleted successfully';

    if (quotesCount > 0 || ordersCount > 0 || invoicesCount > 0) {
      // Deactivate instead of failing foreign key constraints
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });
      actionTaken = 'deactivated';
      message = `Customer has ${quotesCount + ordersCount + invoicesCount} linked record(s) (quotations/orders/invoices) and has been deactivated to preserve transaction history.`;
    } else {
      await prisma.auditLog.deleteMany({ where: { actorId: id } }).catch(() => {});
      await prisma.user.delete({ where: { id } });
      actionTaken = 'deleted';
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || null,
        entityType: 'CUSTOMER',
        entityId: id,
        action: actionTaken === 'deleted' ? 'DELETED' : 'DEACTIVATED',
        oldData: { name: existing.name, email: existing.email, isActive: existing.isActive },
        newData: { status: actionTaken }
      }
    }).catch(() => {});

    sendSuccess(res, 200, message, { id, action: actionTaken });
  } catch (err) { next(err); }
};

