import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } from '../../services/token/jwt.service.js';
import { sendEmail } from '../../services/email/brevo.service.js';
import redis from '../../config/redis.js';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export const signup = async ({ name, email, password, role }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new BadRequestError('Email is already in use');

  const passwordHash = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: { name: name?.trim(), email: normalizedEmail, passwordHash, role: role || 'CUSTOMER' }
  });

  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
};

export const login = async ({ email, password }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid email or password');

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) throw new UnauthorizedError('Invalid email or password');

  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
};

export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Silently return to prevent email enumeration
    return { message: 'If that email exists, an OTP has been sent.' };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store in Redis (expire in 5 minutes = 300s)
  await redis.set(`otp:${email}`, otp, 'EX', 300);

  // Send via Brevo
  await sendEmail({
    to: email,
    subject: 'Your DealFlow360 Password Reset Code',
    templateId: 1, // Example template mapping
    params: { code: otp }
  });

  return { message: 'If that email exists, an OTP has been sent.' };
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp) {
    throw new BadRequestError('Invalid or expired reset code');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('User not found');

  const passwordHash = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });

  await redis.del(`otp:${email}`);
  
  return { message: 'Password has been safely reset' };
};
