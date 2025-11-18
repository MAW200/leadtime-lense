import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const conn = await pool.getConnection();
try {
  const [cols] = await conn.execute('DESCRIBE purchase_orders');
  console.log('\npurchase_orders columns:');
  cols.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''} ${col.Null === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
  });
} catch(e) {
  console.log('Error:', e.message);
} finally {
  conn.release();
  await pool.end();
}

