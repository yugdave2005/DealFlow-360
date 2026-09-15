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
    // user comes from passport
    const user = req.user;
    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setCookies(res, refreshToken);
    
    // Redirect to frontend with access token in fragment or query 
    // In production, sending sensitive token in URL is riskier, but standard for simple setups.
    res.redirect(`${process.env.FRONTEND_URL}/sales?token=${accessToken}`);
  } catch (err) { next(err); }
};
