const { Pool } = require('pg');
require('dotenv').config();

// Initialize the connection pool using the secure connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('WARNING: DATABASE_URL not found in environment variables. Falling back to local configuration.');
}

const poolConfig = connectionString 
    ? {
        connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'globalcollab',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    };

const pool = new Pool(poolConfig);

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to PostgreSQL Database', err);
    } else {
        console.log('PostgreSQL connected successfully', res.rows[0].now);
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // process.exit(-1) could crash production silently on trivial network drops, instead just log
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),
    pool
};
