import z from 'zod';
import { ValidationError } from '../../utils/errors.js';

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER']).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
  })
});

export const requestResetSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format")
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
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
    next(new ValidationError(err.errors));
  }
};
