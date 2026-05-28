const { Sequelize } = require('sequelize');
require('dotenv').config();

// Validasi environment variables yang wajib
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_HOST'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.warn(`⚠️  Missing env vars: ${missingVars.join(', ')} - using defaults`);
}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'concert_db';
const INSTANCE_CONNECTION_NAME = process.env.INSTANCE_CONNECTION_NAME;

// Dialect options: gunakan Cloud SQL socket di production, TCP di lokal
let dialectOptions = {};
if (INSTANCE_CONNECTION_NAME) {
  dialectOptions = {
    socketPath: `/cloudsql/${INSTANCE_CONNECTION_NAME}`
  };
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+07:00' // Timezone Indonesia
});

// Test connection (non-blocking, won't crash if DB is unavailable)
sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Unable to connect to database:', err.message));

module.exports = sequelize;