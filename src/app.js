const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const orderRoutes = require('./modules/orders/order.routes');
const syncRoutes = require('./modules/sync/sync.routes');
const systemRoutes = require('./modules/system/system.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// --- CORS ---
app.use(cors({ origin: '*' }));

// --- Body parsers ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Static uploads ---
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Rate limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/system', systemRoutes);

// --- 404 handler ---
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', error_code: 'NOT_FOUND' });
});

// --- Global error handler (must be last) ---
app.use(errorMiddleware);

module.exports = app;
