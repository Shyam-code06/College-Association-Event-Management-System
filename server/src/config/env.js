const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.NODE_ENV === 'test' 
    ? (process.env.DB_NAME_TEST || 'skyline_test_db') 
    : (process.env.DB_NAME || 'skyline_db'),
  DB_NAME_TEST: process.env.DB_NAME_TEST || 'skyline_test_db',
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  JWT_SECRET: process.env.JWT_SECRET || 'skyline_jwt_secret_fallback_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 2525,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Skyline Student Association <noreply@skyline.edu>',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 30
};

module.exports = env;
