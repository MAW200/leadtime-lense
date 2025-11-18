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

    // Read schema file
    console.log('📄 Reading schema file...');
    let schema = readFileSync(schemaPath, 'utf8');
    
    // Remove DELIMITER statements and handle them properly
    // Split by DELIMITER to handle stored functions
    const parts = schema.split(/DELIMITER\s+(\S+)/i);
    let currentDelimiter = ';';
    let fullSQL = '';
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // This is SQL code
        let sql = parts[i];
        // Replace current delimiter with semicolon for execution
        if (currentDelimiter !== ';') {
          sql = sql.replace(new RegExp(currentDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ';');
        }
        fullSQL += sql;
      } else {
        // This is a delimiter definition
        currentDelimiter = parts[i].trim();
      }
    }
    
    // Split into individual statements
    const statements = fullSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Filter out comments and empty statements
        const cleaned = s.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
        return cleaned.length > 0 && 
               !cleaned.toLowerCase().startsWith('set ') &&
               !cleaned.toLowerCase().startsWith('delimiter');
      });

    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.length > 5) {
        try {
          await connection.query(statement);
          successCount++;
          if ((i + 1) % 20 === 0) {
            console.log(`   ✅ Processed ${i + 1}/${statements.length} statements...`);
          }
        } catch (error) {
          errorCount++;
          // Only show non-ignorable errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate') &&
              !error.message.includes('Unknown system variable') &&
              !error.message.includes('Undeclared variable')) {
            console.warn(`   ⚠️  Statement ${i + 1}: ${error.message.substring(0, 80)}`);
          }
        }
      }
    }

    console.log(`\n✅ Schema import completed! (${successCount} successful, ${errorCount} warnings)`);
    
    // Verify tables were created
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📊 Created ${tables.length} tables:`);
    if (tables.length > 0) {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
      });
    } else {
      console.log('   ⚠️  No tables found. There may have been errors during import.');
      console.log('   💡 Try importing mysql_schema.sql manually using phpMyAdmin or MySQL Workbench');
    }

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

