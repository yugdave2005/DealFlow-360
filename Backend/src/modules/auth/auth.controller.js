import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { generateAccessToken, generateRefreshToken } from '../../services/token/jwt.service.js';

const setCookies = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const signup = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.signup(req.body);
    setCookies(res, refreshToken);
    sendSuccess(res, 201, 'Signup successful', { accessToken, user });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    setCookies(res, refreshToken);
    sendSuccess(res, 200, 'Login successful', { accessToken, user });
  } catch (err) { next(err); }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    sendSuccess(res, 200, result.message);
  } catch (err) { next(err); }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    sendSuccess(res, 200, result.message, result);
  } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    sendSuccess(res, 200, result.message);
  } catch (err) { next(err); }
};

export const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Determine target frontend URL
    let frontendUrl = process.env.FRONTEND_URL;
    
    // If state was passed with returnUrl, extract the base origin
    if (req.query.state) {
      try {
        const decoded = decodeURIComponent(req.query.state);
        if (decoded.startsWith('http')) {
          const parsed = new URL(decoded);
          if (parsed.origin) {
            frontendUrl = parsed.origin;
          }
        }
      } catch (e) {
        // fallback
      }
    }
    
    // If FRONTEND_URL is missing or still localhost in production/cloud, default to Vercel production URL
    if (!frontendUrl || (frontendUrl.includes('localhost') && process.env.NODE_ENV === 'production')) {
      frontendUrl = 'https://dealflow360-chi.vercel.app';
    } else if (!frontendUrl) {
      frontendUrl = 'https://dealflow360-chi.vercel.app';
    }
    
    frontendUrl = frontendUrl.replace(/\/+$/, '');
    
    if (!user) {
      return res.redirect(`${frontendUrl}/auth/login?error=auth_failed`);
    }
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setCookies(res, refreshToken);
    
    const userPayload = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }));
    
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&user=${userPayload}`);
  } catch (err) { 
    next(err); 
  }
};
