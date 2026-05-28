require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set in .env! Using fallback (insecure for production).');
}

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_dev_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d'
};
