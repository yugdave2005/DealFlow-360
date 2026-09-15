import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/not-found.js';
import passport from './services/oauth/passport.js';
import routes from './routes/index.js';

const app = express();

app.use(compression());
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://dealflow360-chi.vercel.app',
  'http://localhost:5173',
  'http://localhost:5001',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, origin);
    }
    // Allow origin dynamically so withCredentials works
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight across all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

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

// API Routes mounted on /api, /v1, and /
app.use('/api', routes);
app.use('/v1', routes);
app.use('/', routes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
