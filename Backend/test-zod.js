import { z } from 'zod';
const schema = z.object({
  body: z.object({
    customerId: z.string().uuid("Invalid Customer ID"),
    lineItems: z.array(z.object({
      productId: z.string().uuid("Invalid Product ID"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0, "Unit price cannot be negative"),
      discountPercentage: z.number().min(0).max(100, "Discount must be between 0 and 100")
    })).min(1, "At least one line item is required")
  })
});
try {
  schema.parse({
    body: {
      customerId: 'bb222222-2222-2222-2222-222222222222', 
      lineItems: [{ productId: '9b155e3e-1fb7-4eb4-8260-62763a3d1fdf', quantity: 5, unitPrice: 2000, discountPercentage: 15 }]
    }
  });
  console.log("No Zod error");
} catch(e) {
  console.dir(e.errors, { depth: null });
}
