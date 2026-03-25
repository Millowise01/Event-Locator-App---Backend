require('dotenv').config();
const pgPromise = require('pg-promise');

const initOptions = {
  capSQL: true,
  error: (err, e) => {
    if (e.query) {
      console.log('Database Error:', err.message);
      console.log('Failed query:', e.query);
    }
  }
};

const pgp = pgPromise(initOptions);

const db = pgp({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'event_locator',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

if (process.env.NODE_ENV !== 'test') {
  db.one('SELECT 1')
    .then(() => {
      console.log('✓ Database connection successful');
    })
    .catch(err => {
      console.error('✗ Database connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = { db, pgp };
