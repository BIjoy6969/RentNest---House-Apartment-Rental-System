// src/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

/* ---------- CORS ---------- */
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
    credentials: false, // we use Bearer tokens, not cookies
  })
);

/* ---------- Body parsing ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ---------- Static uploads ---------- */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

/* ---------- Health ---------- */
app.get('/', (_req, res) => res.json({ ok: true, name: 'RentNest API' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'RentNest API' }));

/* ---------- Routes ---------- */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

/* ---------- Global error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

/* ---------- Start server if run directly ---------- */
const PORT = process.env.PORT || 5000;

if (require.main === module || !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API running on http://localhost:${PORT}`);
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
