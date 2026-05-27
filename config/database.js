const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    dialectOptions: process.env.INSTANCE_CONNECTION_NAME ? {
      socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+07:00' // Timezone Indonesia
  }
);

// Test connection (non-blocking, won't crash if DB is unavailable)
sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Unable to connect to database:', err.message));

module.exports = sequelize;