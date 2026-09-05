import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../../utils/response.js';

const prisma = new PrismaClient();

// -- Products --
export const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ include: { pricing: true } });
    sendSuccess(res, 200, 'Products fetched successfully', products);
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, category, isSubscription, recurringInterval, quantityOnHand, variantAttributes } = req.body;
    const product = await prisma.product.create({
      data: { name, category, isSubscription, recurringInterval, quantityOnHand, variantAttributes }
    });
    sendSuccess(res, 201, 'Product created successfully', product);
  } catch (err) { next(err); }
};

// -- Customer Tiers --
export const getCustomerTiers = async (req, res, next) => {
  try {
    const tiers = await prisma.customerTier.findMany();
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
    const rules = await prisma.discountRule.findMany({ include: { targetTier: true } });
    sendSuccess(res, 200, 'Discount rules fetched', rules);
  } catch (err) { next(err); }
};

export const createDiscountRule = async (req, res, next) => {
  try {
    const { appliedTo, targetTierId, productCategory, maxDiscountPercentage } = req.body;
    const rule = await prisma.discountRule.create({ data: { appliedTo, targetTierId, productCategory, maxDiscountPercentage } });
    sendSuccess(res, 201, 'Discount rule created', rule);
  } catch (err) { next(err); }
};

// -- Approval Rules --
export const getApprovalRules = async (req, res, next) => {
  try {
    const rules = await prisma.approvalRule.findMany();
    sendSuccess(res, 200, 'Approval rules fetched', rules);
  } catch (err) { next(err); }
};

export const createApprovalRule = async (req, res, next) => {
  try {
    const { minRiskScore, maxRiskScore, requiredApproverLevel } = req.body;
    const rule = await prisma.approvalRule.create({ data: { minRiskScore, maxRiskScore, requiredApproverLevel } });
    sendSuccess(res, 201, 'Approval rule created', rule);
  } catch (err) { next(err); }
};
