import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // SSL configuration for AWS RDS (optional, set DB_SSL=true to enable)
  ...(process.env.DB_SSL === 'true' && {
    ssl: {
      rejectUnauthorized: false // For AWS RDS certificates
    }
  }),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection
pool.getConnection()
  .then((connection) => {
    console.log('✅ MySQL database connected successfully');
    connection.release();
  })
  .catch((error) => {
    console.error('❌ MySQL database connection failed:', error.message);
    process.exit(1);
  });

export default pool;

