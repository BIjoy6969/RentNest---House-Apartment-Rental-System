// src/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

dotenv.config();

// Fail fast in production if JWT_SECRET is not explicitly set
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}

const app = express();

/* ---------- CORS Configuration ---------- */
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app')
      ) {
        return cb(null, true);
      }
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: false
  })
);

/* ---------- Security Headers (helmet) ---------- */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // allow images to be fetched cross-origin
}));

/* ---------- Request Logging ---------- */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/* ---------- Rate Limiting for Security ---------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

/* ---------- Body parsing ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ---------- Static uploads serving ---------- */
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

/* ---------- Database connection middleware ---------- */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Database connection error' });
  }
});

/* ---------- Health check ---------- */
app.get('/', (_req, res) => res.json({ ok: true, name: 'RentNest API', version: '2.0.0' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'RentNest API', status: 'healthy' }));

/* ---------- API Routes ---------- */
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tour-decisions', require('./routes/tourDecisionRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

/* ---------- 404 handler ---------- */
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found` });
});

/* ---------- Global error handler (Safe production responses) ---------- */
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({
    message: err.message || 'Internal server error'
  });
});

/* ---------- Start server ---------- */
const PORT = process.env.PORT || 5000;

if (require.main === module || !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`RentNest API running on http://localhost:${PORT}`);
      });
    })
    .catch((e) => {
      console.error('Mongo connection error:', e);
    });
}

/* ---------- Safety for unhandled rejections ---------- */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = app;
