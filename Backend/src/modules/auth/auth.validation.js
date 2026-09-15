import z from 'zod';
import { BadRequestError } from '../../utils/errors.js';

const emailValidator = z.string({
  required_error: "Email is required",
  invalid_type_error: "Email must be a string"
})
  .trim()
  .min(1, "Email is required")
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address (e.g. name@company.com)");

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: emailValidator,
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER']).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: emailValidator,
    password: z.string().min(1, "Password is required")
  })
});

export const requestResetSchema = z.object({
  body: z.object({
    email: emailValidator
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: emailValidator,
    otp: z.string().length(6, "OTP must be exactly 6 digits")
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: emailValidator,
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
    const firstError = err.issues?.[0]?.message || err.errors?.[0]?.message || 'Validation Error';
    next(new BadRequestError(firstError, err.issues || err.errors));
  }
};

