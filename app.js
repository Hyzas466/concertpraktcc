const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (untuk QR codes & banners)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/attendees', attendeeRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Konfigurasi Port untuk Cloud Run
const PORT = process.env.PORT || 5000;

// Mulai sinkronisasi database lalu jalankan server
sequelize.sync({ alter: false }) // Set to true untuk auto-update schema (hati-hati di production)
  .then(() => {
    console.log('✅ Database synced');
    
    // Server HANYA dipanggil di sini dan WAJIB menggunakan '0.0.0.0'
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('❌ Database sync failed:', err);
    // Menghentikan proses node.js jika database gagal connect
    // Ini penting agar Cloud Run tahu container-nya error dan tidak menggantung
    process.exit(1);
  });
