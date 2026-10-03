const knex = require('knex');
const env = require('./env');

const db = knex({
  client: 'mysql2',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    dateStrings: true
  },
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX
  }
});

module.exports = db;
