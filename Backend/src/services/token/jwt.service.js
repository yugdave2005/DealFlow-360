import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

// Passwords
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Tokens
export const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  });
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};
