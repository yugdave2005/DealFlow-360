import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../../utils/response.js';

const prisma = new PrismaClient();

// -- Products --
export const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ 
      include: { pricing: true },
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
      pricing
    } = req.body;

    const basePrice = price !== undefined ? Number(price) : (pricing?.[0]?.price !== undefined ? Number(pricing[0].price) : 0);
    const isSub = isSubscription === true || isSubscription === 'true';
    const qty = parseInt(quantityOnHand, 10) || 0;

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
    sendSuccess(res, 201, 'Product created successfully', product);
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
      pricing
    } = req.body;

    const rawPrice = price !== undefined ? price : pricing?.[0]?.price;
    const basePrice = rawPrice !== undefined ? Number(rawPrice) : undefined;
    const isSub = isSubscription !== undefined ? (isSubscription === true || isSubscription === 'true') : undefined;
    const qty = quantityOnHand !== undefined ? (parseInt(quantityOnHand, 10) || 0) : undefined;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (isSub !== undefined) updateData.isSubscription = isSub;
    if (recurringInterval !== undefined) updateData.recurringInterval = isSub ? recurringInterval : null;
    if (qty !== undefined) updateData.quantityOnHand = qty;
    if (variantAttributes !== undefined) updateData.variantAttributes = variantAttributes;

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
      include: { pricing: true }
    });

    sendSuccess(res, 200, 'Product updated successfully', updated);
  } catch (err) { next(err); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.productPricing.deleteMany({ where: { productId: id } });
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
    if (rules.length === 0) {
      const defaultRules = [
        { appliedTo: 'CATEGORY', productCategory: 'Hardware', maxDiscountPercentage: 15 },
        { appliedTo: 'CATEGORY', productCategory: 'Services', maxDiscountPercentage: 20 },
        { appliedTo: 'CATEGORY', productCategory: 'Subscriptions', maxDiscountPercentage: 25 },
        { appliedTo: 'CATEGORY', productCategory: 'Cloud', maxDiscountPercentage: 12 }
      ];
      for (const r of defaultRules) {
        await prisma.discountRule.create({ data: r });
      }
      rules = await prisma.discountRule.findMany({ include: { targetTier: true }, orderBy: { maxDiscountPercentage: 'asc' } });
    }
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
    if (rules.length === 0) {
      const defaultRules = [
        { minRiskScore: 0, maxRiskScore: 25, requiredApproverLevel: 'SALES_REP', priority: 1 },
        { minRiskScore: 26, maxRiskScore: 50, requiredApproverLevel: 'SALES_MANAGER', priority: 2 },
        { minRiskScore: 51, maxRiskScore: 75, requiredApproverLevel: 'FINANCE', priority: 3 },
        { minRiskScore: 76, maxRiskScore: 100, requiredApproverLevel: 'ADMIN', priority: 4 }
      ];
      for (const r of defaultRules) {
        await prisma.approvalRule.create({ data: r });
      }
      rules = await prisma.approvalRule.findMany({ orderBy: { minRiskScore: 'asc' } });
    }
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

// -- Users Directory --
export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    sendSuccess(res, 200, 'Users retrieved successfully', users);
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
    sendSuccess(res, 200, 'User updated successfully', user);
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    sendSuccess(res, 200, 'User deleted successfully');
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

    // 2. Fetch quotations to aggregate pipeline metrics
    const quotations = await prisma.quotation.findMany({
      include: {
        activeVersion: true
      }
    });

    // 3. Map customer users into full commercial profiles
    const customerList = customerUsers.map(user => {
      const userQuotes = quotations.filter(q => q.customerId === user.id || q.quotationNumber?.includes(user.name));
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
        pipelineValue: pipelineValue,
        lastActivity: userQuotes.length > 0 ? 'Active Deals' : 'Registered Account',
        riskScore: avgRisk,
        riskLevel: avgRisk > 60 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW',
        isActive: user.isActive,
        createdAt: user.createdAt
      };
    });

    // Fallback: If no customer users yet, generate tier seed samples
    if (customerList.length === 0) {
      const tiers = await prisma.customerTier.findMany();
      tiers.forEach(tier => {
        customerList.push({
          id: tier.id,
          name: tier.name,
          email: `contact@${tier.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          companyName: `${tier.name} Corporation`,
          tier: tier.name.toUpperCase().includes('ENTERPRISE') ? 'ENTERPRISE' : tier.name.toUpperCase().includes('GOLD') ? 'GOLD' : 'SILVER',
          contactName: tier.description || 'Account Representative',
          activeQuotesCount: 0,
          pipelineValue: 0,
          lastActivity: 'Tier Account',
          riskScore: 0,
          riskLevel: 'LOW',
          isActive: true,
          createdAt: new Date().toISOString()
        });
      });
    }

    sendSuccess(res, 200, 'Customers fetched successfully', customerList);
  } catch (err) { next(err); }
};
