/**
 * Create Missing Tables Script
 * Checks existing tables and creates only the missing ones
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'invmod',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true, // Allow multiple statements
});

console.log('🔍 Checking existing tables...\n');

async function createMissingTables() {
  const connection = await pool.getConnection();
  
  try {
    // Get existing tables
    const [existingTables] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`
    );
    const existingTableNames = existingTables.map(row => row.TABLE_NAME.toLowerCase());
    
    console.log(`📊 Found ${existingTableNames.length} existing tables:`);
    existingTableNames.forEach(name => console.log(`   ✅ ${name}`));
    console.log('');

    // Read schema file
    const schemaPath = join(__dirname, '../../mysql_schema.sql');
    let schemaSQL = readFileSync(schemaPath, 'utf8');

    // List of all tables we need
    const requiredTables = [
      'vendors',
      'inventory_items',
      'product_vendors',
      'internal_requests',
      'request_items',
      'purchase_orders',
      'purchase_order_items',
      'projects',
      'audit_logs',
      'user_profiles',
      'project_templates',
      'project_template_items',
      'project_materials',
      'claims',
      'claim_items',
      'returns',
      'return_items',
      'stock_adjustments',
      'notifications',
      'user_projects'
    ];

    // Find missing tables
    const missingTables = requiredTables.filter(
      table => !existingTableNames.includes(table.toLowerCase())
    );

    if (missingTables.length === 0) {
      console.log('✅ All required tables already exist!\n');
      return;
    }

    console.log(`⚠️  Missing ${missingTables.length} tables:`);
    missingTables.forEach(name => console.log(`   ❌ ${name}`));
    console.log('');

    // Parse schema to extract CREATE TABLE statements
    // Split by CREATE TABLE statements
    const createTableRegex = /CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/gi;
    const statements = schemaSQL.split(/;\s*(?=CREATE|SET|DELIMITER)/i);
    
    // Extract CREATE TABLE statements for missing tables
    const tablesToCreate = [];
    
    for (const statement of statements) {
      const match = statement.match(createTableRegex);
      if (match) {
        const tableName = match[0].match(/`?(\w+)`?/i)[1].toLowerCase();
        if (missingTables.includes(tableName)) {
          // Clean up the statement
          let cleanStatement = statement.trim();
          // Remove DELIMITER commands
          cleanStatement = cleanStatement.replace(/DELIMITER\s+[^\s]+/gi, '');
          // Ensure it ends with semicolon
          if (!cleanStatement.endsWith(';')) {
            cleanStatement += ';';
          }
          tablesToCreate.push({ name: tableName, sql: cleanStatement });
        }
      }
    }

    // Also check for CREATE TABLE statements that might be formatted differently
    const tableStatements = schemaSQL.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?[^;]+;/gi);
    if (tableStatements) {
      for (const statement of tableStatements) {
        const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          if (missingTables.includes(tableName) && !tablesToCreate.find(t => t.name === tableName)) {
            let cleanStatement = statement.trim();
            cleanStatement = cleanStatement.replace(/DELIMITER\s+[^\s]+/gi, '');
            if (!cleanStatement.endsWith(';')) {
              cleanStatement += ';';
            }
            tablesToCreate.push({ name: tableName, sql: cleanStatement });
          }
        }
      }
    }

    if (tablesToCreate.length === 0) {
      console.log('⚠️  Could not parse CREATE TABLE statements from schema file.\n');
      console.log('📝 Creating tables manually...\n');
      
      // Create tables manually using simplified schema
      await createTablesManually(connection, missingTables);
      return;
    }

    console.log(`🔨 Creating ${tablesToCreate.length} missing tables...\n`);

    // Create tables in order (respecting foreign key dependencies)
    const creationOrder = [
      'vendors',
      'inventory_items',
      'product_vendors',
      'projects',
      'user_profiles',
      'internal_requests',
      'request_items',
      'purchase_orders',
      'purchase_order_items',
      'project_templates',
      'project_template_items',
      'project_materials',
      'claims',
      'claim_items',
      'returns',
      'return_items',
      'stock_adjustments',
      'notifications',
      'user_projects',
      'audit_logs'
    ];

    // Create tables in dependency order
    for (const tableName of creationOrder) {
      if (missingTables.includes(tableName)) {
        const tableDef = tablesToCreate.find(t => t.name === tableName);
        if (tableDef) {
          try {
            console.log(`   Creating ${tableName}...`);
            await connection.execute(tableDef.sql);
            console.log(`   ✅ Created ${tableName}`);
          } catch (error) {
            console.log(`   ❌ Failed to create ${tableName}: ${error.message}`);
            // Try manual creation as fallback
            await createTableManually(connection, tableName);
          }
        } else {
          // Fallback to manual creation
          await createTableManually(connection, tableName);
        }
      }
    }

    console.log('\n✅ Finished creating missing tables!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

async function createTablesManually(connection, missingTables) {
  const tableDefinitions = {
    vendors: `
      CREATE TABLE IF NOT EXISTS vendors (
        id CHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        lead_time_days INT DEFAULT 14,
        country VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vendors_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    inventory_items: `
      CREATE TABLE IF NOT EXISTS inventory_items (
        id CHAR(36) PRIMARY KEY,
        product_name TEXT NOT NULL,
        sku VARCHAR(255) UNIQUE NOT NULL,
        in_stock INT DEFAULT 0,
        allocated INT DEFAULT 0,
        consumed_30d INT DEFAULT 0,
        on_order_local_14d INT DEFAULT 0,
        on_order_shipment_a_60d INT DEFAULT 0,
        on_order_shipment_b_60d INT DEFAULT 0,
        signed_quotations INT DEFAULT 0,
        projected_stock INT DEFAULT 0,
        safety_stock INT DEFAULT 25,
        unit_cost DECIMAL(10,2) DEFAULT 125.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_inventory_items_sku (sku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    product_vendors: `
      CREATE TABLE IF NOT EXISTS product_vendors (
        id CHAR(36) PRIMARY KEY,
        product_id CHAR(36) NOT NULL,
        vendor_id CHAR(36) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        vendor_sku TEXT,
        unit_price DECIMAL(10,2) DEFAULT 0,
        minimum_order_qty INT DEFAULT 1,
        lead_time_days INT DEFAULT 14,
        last_order_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_product_vendor (product_id, vendor_id),
        INDEX idx_product_vendors_product_id (product_id),
        INDEX idx_product_vendors_vendor_id (vendor_id),
        FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    projects: `
      CREATE TABLE IF NOT EXISTS projects (
        id CHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_projects_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    user_profiles: `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id CHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        email VARCHAR(255) UNIQUE,
        role ENUM('ceo_admin', 'warehouse_admin', 'onsite_team') DEFAULT 'onsite_team',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_profiles_email (email),
        INDEX idx_user_profiles_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    internal_requests: `
      CREATE TABLE IF NOT EXISTS internal_requests (
        id CHAR(36) PRIMARY KEY,
        request_number VARCHAR(255) UNIQUE NOT NULL,
        requester_name TEXT NOT NULL,
        requester_email TEXT,
        destination_property TEXT NOT NULL,
        status ENUM('pending', 'fulfilled', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        fulfilled_date DATETIME,
        project_id CHAR(36),
        photo_url TEXT,
        created_by_role VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_internal_requests_status (status),
        INDEX idx_internal_requests_created_at (created_at DESC),
        INDEX idx_internal_requests_project_id (project_id),
        INDEX idx_internal_requests_created_by_role (created_by_role),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    request_items: `
      CREATE TABLE IF NOT EXISTS request_items (
        id CHAR(36) PRIMARY KEY,
        request_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        quantity_requested INT NOT NULL DEFAULT 0,
        quantity_fulfilled INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_request_items_request_id (request_id),
        INDEX idx_request_items_product_id (product_id),
        FOREIGN KEY (request_id) REFERENCES internal_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    purchase_orders: `
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id CHAR(36) PRIMARY KEY,
        po_number VARCHAR(255) UNIQUE NOT NULL,
        vendor_id CHAR(36) NOT NULL,
        status ENUM('draft', 'sent', 'confirmed', 'received', 'cancelled') DEFAULT 'draft',
        total_amount DECIMAL(10,2) DEFAULT 0,
        order_date DATETIME,
        expected_delivery_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_purchase_orders_vendor_id (vendor_id),
        INDEX idx_purchase_orders_status (status),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    purchase_order_items: `
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id CHAR(36) PRIMARY KEY,
        po_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_purchase_order_items_po_id (po_id),
        INDEX idx_purchase_order_items_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    project_templates: `
      CREATE TABLE IF NOT EXISTS project_templates (
        id CHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    project_template_items: `
      CREATE TABLE IF NOT EXISTS project_template_items (
        id CHAR(36) PRIMARY KEY,
        template_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_project_template_items_template_id (template_id),
        INDEX idx_project_template_items_product_id (product_id),
        FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    project_materials: `
      CREATE TABLE IF NOT EXISTS project_materials (
        id CHAR(36) PRIMARY KEY,
        project_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        quantity_required INT NOT NULL DEFAULT 0,
        quantity_claimed INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_project_materials_project_id (project_id),
        INDEX idx_project_materials_product_id (product_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    claims: `
      CREATE TABLE IF NOT EXISTS claims (
        id CHAR(36) PRIMARY KEY,
        claim_number VARCHAR(255) UNIQUE NOT NULL,
        project_id CHAR(36) NOT NULL,
        requested_by TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'fulfilled') DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_claims_project_id (project_id),
        INDEX idx_claims_status (status),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    claim_items: `
      CREATE TABLE IF NOT EXISTS claim_items (
        id CHAR(36) PRIMARY KEY,
        claim_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        quantity_requested INT NOT NULL DEFAULT 0,
        quantity_approved INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_claim_items_claim_id (claim_id),
        INDEX idx_claim_items_product_id (product_id),
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    returns: `
      CREATE TABLE IF NOT EXISTS returns (
        id CHAR(36) PRIMARY KEY,
        return_number VARCHAR(255) UNIQUE NOT NULL,
        project_id CHAR(36) NOT NULL,
        claim_id CHAR(36),
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'processed') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_returns_project_id (project_id),
        INDEX idx_returns_claim_id (claim_id),
        INDEX idx_returns_status (status),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    return_items: `
      CREATE TABLE IF NOT EXISTS return_items (
        id CHAR(36) PRIMARY KEY,
        return_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_return_items_return_id (return_id),
        INDEX idx_return_items_product_id (product_id),
        FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    stock_adjustments: `
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id CHAR(36) PRIMARY KEY,
        adjustment_number VARCHAR(255) UNIQUE NOT NULL,
        product_id CHAR(36) NOT NULL,
        adjustment_type ENUM('increase', 'decrease', 'correction') NOT NULL,
        quantity INT NOT NULL,
        reason TEXT NOT NULL,
        adjusted_by TEXT NOT NULL,
        related_claim_id CHAR(36),
        related_return_id CHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_stock_adjustments_product_id (product_id),
        INDEX idx_stock_adjustments_adjustment_type (adjustment_type),
        FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
        FOREIGN KEY (related_claim_id) REFERENCES claims(id) ON DELETE SET NULL,
        FOREIGN KEY (related_return_id) REFERENCES returns(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    notifications: `
      CREATE TABLE IF NOT EXISTS notifications (
        id CHAR(36) PRIMARY KEY,
        user_id VARCHAR(255),
        user_role ENUM('ceo_admin', 'warehouse_admin', 'onsite_team'),
        type VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_notifications_user_id (user_id),
        INDEX idx_notifications_user_role (user_role),
        INDEX idx_notifications_is_read (is_read),
        INDEX idx_notifications_created_at (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    user_projects: `
      CREATE TABLE IF NOT EXISTS user_projects (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id CHAR(36) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_project (user_id, project_id),
        INDEX idx_user_projects_user_id (user_id),
        INDEX idx_user_projects_project_id (project_id),
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    audit_logs: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id CHAR(36) PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_name TEXT NOT NULL,
        user_role ENUM('ceo_admin', 'warehouse_admin', 'onsite_team', 'system'),
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        related_entity_type TEXT,
        related_entity_id CHAR(36),
        photo_url TEXT,
        metadata JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_logs_timestamp (timestamp DESC),
        INDEX idx_audit_logs_user_name (user_name(255)),
        INDEX idx_audit_logs_action_type (action_type(255)),
        INDEX idx_audit_logs_related_entity (related_entity_type(255), related_entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  };

  const creationOrder = [
    'vendors',
    'inventory_items',
    'product_vendors',
    'projects',
    'user_profiles',
    'internal_requests',
    'request_items',
    'purchase_orders',
    'purchase_order_items',
    'project_templates',
    'project_template_items',
    'project_materials',
    'claims',
    'claim_items',
    'returns',
    'return_items',
    'stock_adjustments',
    'notifications',
    'user_projects',
    'audit_logs'
  ];

  for (const tableName of creationOrder) {
    if (missingTables.includes(tableName)) {
      try {
        console.log(`   Creating ${tableName}...`);
        await connection.execute(tableDefinitions[tableName]);
        console.log(`   ✅ Created ${tableName}`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${tableName}: ${error.message}`);
        // Continue with other tables
      }
    }
  }
}

async function createTableManually(connection, tableName) {
  // This is a fallback - will be handled by createTablesManually
  return createTablesManually(connection, [tableName]);
}

// Run the script
createMissingTables()
  .then(() => {
    console.log('🎉 Table creation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Table creation failed:', error);
    process.exit(1);
  });

