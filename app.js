const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ── Validasi Keamanan Production ──────────────────────────────
// Hentikan server jika JWT_SECRET lemah/default di production
if (process.env.NODE_ENV === 'production') {
  const weakSecrets = ['', 'your_jwt_secret_here', 'fallback_dev_secret_change_in_production'];
  if (!process.env.JWT_SECRET || weakSecrets.includes(process.env.JWT_SECRET)) {
    console.error('❌ FATAL: JWT_SECRET tidak aman untuk production! Set via Secret Manager.');
    process.exit(1);
  }
}
// ─────────────────────────────────────────────────────────────

const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');


// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const orderRoutes = require('./routes/orderRoutes');
const attendeeRoutes = require('./routes/attendeeRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (untuk QR codes & banners)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/attendees', attendeeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use(errorHandler);

// Port - Cloud Run menggunakan PORT dari env, default 5000 untuk lokal
const PORT = process.env.PORT || 5000;

// Start server FIRST agar Cloud Run health check langsung pass
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  // Sinkronisasi database SETELAH server sudah listen
  sequelize.sync({ alter: false })
    .then(() => {
      console.log('✅ Database synced successfully');
    })
    .catch(err => {
      console.error('❌ Database sync failed:', err.message);
      // Tidak crash server - tetap jalan agar Cloud Run health check pass
    });
});

module.exports = server;
