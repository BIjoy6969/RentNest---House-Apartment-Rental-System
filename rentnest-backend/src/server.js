// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/adminRoutes');  // Import the new admin routes

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: false
}));

/* ---------- CORS ---------- */
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Accept requests from allowed origins; allow tools like Postman (no Origin header)
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: false, // we use Bearer tokens, not cookies
  })
);

/* ---------- Body parsing ---------- */
app.use(express.json({ limit: '1mb' }));

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
 // Admin routes added
/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

/* ---------- Global error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

/* ---------- MongoDB ---------- */
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI (or MONGODB_URI) in .env');
  process.exit(1);
}

mongoose.set('strictQuery', false);

/* ---------- Start after DB connects ---------- */
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Mongo connection error:', e);
    process.exit(1);
  }
})();

/* ---------- Safety for unhandled rejections ---------- */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
