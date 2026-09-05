import { z } from 'zod';
import { ValidationError } from '../../utils/errors.js';

export const createQuotationSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, "Customer ID required"),
    lineItems: z.array(z.object({
      productId: z.string().min(1, "Product ID required"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0, "Unit price cannot be negative"),
      discountPercentage: z.number().min(0).max(100, "Discount must be between 0 and 100")
    })).min(1, "At least one line item is required")
  })
});

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (err) {
    console.log("VALIDATION ERROR CAUGHT:", err);
    next(new ValidationError(err.issues || err.errors || err.message));
  }
};
