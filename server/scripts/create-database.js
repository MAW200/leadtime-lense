import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'leadtime_lense';
const schemaPath = join(__dirname, '../../mysql_schema.sql');

async function createDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    console.log(`📦 Creating database '${dbName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Use the database
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Using database '${dbName}'`);

    // Read and execute schema file
    console.log('📄 Reading schema file...');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Skip comments and empty statements
      if (statement && !statement.startsWith('--') && statement.length > 10) {
        try {
          await connection.query(statement);
          if ((i + 1) % 10 === 0) {
            console.log(`   Processed ${i + 1}/${statements.length} statements...`);
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
            console.warn(`   ⚠️  Statement ${i + 1} warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Schema imported successfully!');
    
    // Verify tables were created
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📊 Created ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
    });

    console.log('\n🎉 Database setup complete!');
    
  } catch (error) {
    console.error('\n❌ Error creating database:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure MySQL server is running!');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Check your MySQL username and password in server/.env');
    } else if (error.code === 'ENOENT') {
      console.error(`\n💡 Schema file not found at: ${schemaPath}`);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connection closed');
    }
  }
}

createDatabase();

