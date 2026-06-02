require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

// Route imports
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const { catRouter, cartRouter, orderRouter, userRouter, adminRouter, reviewRouter } = require('./routes/allRoutes');

// Initialize DB pool
require('./config/db');

const app = express();

// ── Security & Infra Middleware ───────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ─────────────────────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message:  { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// ── Body Parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files ──────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', catRouter);
app.use('/api/cart',       cartRouter);
app.use('/api/orders',     orderRouter);
app.use('/api/users',      userRouter);
app.use('/api/admin',      adminRouter);
app.use('/api/reviews',    reviewRouter);

// ── Health Check ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ShopKart API is running 🚀', timestamp: new Date() });
});

// ── 404 Handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  const status  = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(status).json({ success: false, message, ...(err.errors && { errors: err.errors }) });
});

// ── Start ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ShopKart API running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
