import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/not-found.js';
import passport from './services/oauth/passport.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));
// app.use(globalLimiter); // Temporarily disabled for testing

app.use(passport.initialize());

// Health check for UptimeRobot & deployment monitors (supports GET and HEAD)
app.all(['/', '/health', '/ping'], (req, res) => {
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  res.status(200).json({
    status: 'healthy',
    message: 'DealFlow360 Backend is running 🚀',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
