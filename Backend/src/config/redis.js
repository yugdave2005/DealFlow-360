import 'dotenv/config';
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  logger.error(err, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

export default redis;
