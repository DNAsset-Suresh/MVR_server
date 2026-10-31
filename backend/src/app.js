import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDbConfigStatus } from './config/db.js';
import { assistantRouter } from './routes/assistantRoutes.js';
import { bookingRouter } from './routes/bookingRoutes.js';
import { bookstoreRouter } from './routes/bookstoreRoutes.js';

dotenv.config();
dotenv.config({ path: '../.env' });

export const app = express();

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// Security & Middleware
app.use(cors({
  origin: clientOrigin,
  credentials: true
}));

// Body parser with 5MB limit (accommodates bounded base64 voice inputs)
app.use(express.json({ limit: '5mb' }));

// Root route: Redirect browser requests to the frontend website (http://localhost:5173)
app.get('/', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  if (req.accepts('html')) {
    return res.redirect(clientUrl);
  }
  return res.json({
    status: 'ok',
    message: 'InspireUp API Server',
    website: clientUrl,
    endpoints: {
      health: '/api/health',
      system: '/api/system/status',
      assistant: '/api/assistant',
      bookings: '/api/bookings',
      books: '/api/books'
    }
  });
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'InspireUp API',
    timestamp: new Date().toISOString()
  });
});

// Safe system and database status endpoint
app.get('/api/system/status', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    serverPort: process.env.PORT || 5000,
    database: getDbConfigStatus(),
    geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
});

// Mount API Routes
app.use('/api/assistant', assistantRouter);
app.use('/api', bookingRouter);
app.use('/api', bookstoreRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global Error Handler (Sanitizes errors; hides internal stack traces and secrets)
app.use((err, req, res, next) => {
  console.error('[InspireUp Server Error]:', err.message);
  const status = err.status || 500;
  const isTooLarge = status === 413 || err.type === 'entity.too.large';
  res.status(status).json({
    success: false,
    error: isTooLarge
      ? 'Audio payload exceeds maximum allowed size limit of 5MB.'
      : (err.message || 'Internal server error')
  });
});
