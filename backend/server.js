import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import messageRoutes from './routes/messages.js';
import db from './database/db.js'; // This triggers database initialization
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8081';

// Security Middleware
app.use(helmet()); // Add security headers

// CORS Configuration
const corsOptions = {
  origin: CORS_ORIGIN.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate Limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Serve uploaded files with proper caching headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: false
}));

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// Routes with authentication rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 404 Error Handler
app.use((req, res) => {
  logger.warn('404 - Route not found', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, { path: req.path });
  
  // Don't expose internal error details in production
  const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(err.status || 500).json({ error: message });
});

// Server startup
app.listen(PORT, () => {
  logger.info(`🚀 Backend server running at http://localhost:${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
  logger.info(`CORS enabled for: ${CORS_ORIGIN}`);
  
  if (NODE_ENV === 'development') {
    logger.info('📝 Demo operator email: zeeshan@gmail.com');
    logger.info('🔑 Demo operator password: Pesu@123');
    logger.warn('⚠️ Default credentials should be changed in production');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
