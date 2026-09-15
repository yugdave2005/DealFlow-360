import express from 'express';
import passport from 'passport';
import * as authController from './auth.controller.js';
import { validate, loginSchema, signupSchema, requestResetSchema, verifyOtpSchema, resetPasswordSchema } from './auth.validation.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);

router.post('/forgot-password', validate(requestResetSchema), authController.requestPasswordReset);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

export default router;
