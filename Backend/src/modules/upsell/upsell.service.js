import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate upsell/cross-sell suggestions based on category affinity.
 * For each product in the quotation, suggest other products from:
 * 1. Same category (upsell — higher priced variants)
 * 2. Complementary categories (cross-sell — simple affinity map)
 * 
 * Returns ranked suggestions with margin delta info.
 */

const CATEGORY_AFFINITY = {
  'Hardware': ['Services', 'Accessories', 'Support'],
  'Software': ['Services', 'Support', 'Training'],
  'Services': ['Software', 'Hardware', 'Training'],
  'Accessories': ['Hardware', 'Software'],
  'Support': ['Software', 'Hardware'],
  'Training': ['Software', 'Services']
};

export const getSuggestions = async (lineItems) => {
  if (!lineItems || lineItems.length === 0) return [];

  // Collect categories currently in the quotation
  const productIds = lineItems.map(item => item.productId);
  const currentProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { pricing: true }
  });

  const currentCategories = [...new Set(currentProducts.map(p => p.category))];
  const currentProductIdSet = new Set(productIds);

  // Build list of related categories
  const relatedCategories = new Set();
  for (const cat of currentCategories) {
    const affinities = CATEGORY_AFFINITY[cat] || [];
    affinities.forEach(a => relatedCategories.add(a));
    relatedCategories.add(cat); // same-category upsell
  }

  // Find candidate products NOT already in the quotation
  const candidates = await prisma.product.findMany({
    where: {
      category: { in: [...relatedCategories] },
      id: { notIn: [...currentProductIdSet] }
    },
    include: { pricing: true },
    take: 10
  });

  // Rank and format suggestions
  const suggestions = candidates.map(product => {
    const basePrice = product.pricing?.[0]?.price ? Number(product.pricing[0].price) : 0;
    const isSameCategory = currentCategories.includes(product.category);

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: basePrice,
      type: isSameCategory ? 'UPSELL' : 'CROSS_SELL',
      reason: isSameCategory
        ? `Higher-value option in ${product.category}`
        : `Commonly paired with ${currentCategories[0]}`,
      marginDelta: basePrice * 0.15 // estimated 15% margin contribution
    };
  });

  // Sort: cross-sell first (higher margin potential), then by price desc
  suggestions.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'CROSS_SELL' ? -1 : 1;
    return b.price - a.price;
  });

  return suggestions.slice(0, 6);
};
