/**
 * Seed Dummy Data Script
 * Populates the database with sample data for testing
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
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
});

// Helper to generate UUID
const uuid = () => uuidv4();

// Helper to get random element from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date in last 30 days
const randomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

console.log('🌱 Starting dummy data seeding...\n');

async function seedData() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Clear existing data (optional - comment out if you want to keep existing data)
    console.log('📋 Clearing existing data...');
    const tables = [
      'return_items', 'returns', 'claim_items', 'claims', 'stock_adjustments',
      'project_materials', 'project_template_items', 'project_templates',
      'user_projects', 'notifications', 'purchase_order_items', 'purchase_orders',
      'request_items', 'internal_requests', 'product_vendors', 'inventory_items',
      'vendors', 'projects', 'user_profiles', 'audit_logs'
    ];
    
    for (const table of tables) {
      try {
        await connection.execute(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleared ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Could not clear ${table}: ${error.message}`);
      }
    }

    // 2. Seed Vendors
    console.log('\n🏢 Seeding vendors...');
    const vendors = [
      { id: uuid(), name: 'ABC Suppliers Inc.', contact_email: 'contact@abcsuppliers.com', contact_phone: '555-0100', lead_time_days: 7, country: 'USA' },
      { id: uuid(), name: 'Global Materials Co.', contact_email: 'sales@globalmaterials.com', contact_phone: '555-0200', lead_time_days: 14, country: 'USA' },
      { id: uuid(), name: 'Premium Hardware Ltd.', contact_email: 'info@premiumhardware.com', contact_phone: '555-0300', lead_time_days: 21, country: 'Canada' },
      { id: uuid(), name: 'Quick Ship Distributors', contact_email: 'orders@quickship.com', contact_phone: '555-0400', lead_time_days: 5, country: 'USA' },
      { id: uuid(), name: 'Quality Build Supplies', contact_email: 'support@qualitybuild.com', contact_phone: '555-0500', lead_time_days: 10, country: 'USA' },
    ];

    for (const vendor of vendors) {
      await connection.execute(
        `INSERT INTO vendors (id, name, contact_email, contact_phone, lead_time_days, country, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [vendor.id, vendor.name, vendor.contact_email, vendor.contact_phone, vendor.lead_time_days, vendor.country]
      );
    }
    console.log(`  ✅ Created ${vendors.length} vendors`);

    // 3. Seed Inventory Items
    console.log('\n📦 Seeding inventory items...');
    const inventoryItems = [
      { name: '2x4 Lumber - 8ft', sku: 'LUM-2X4-8FT', in_stock: 150, unit_cost: 8.50, safety_stock: 25 },
      { name: '2x4 Lumber - 10ft', sku: 'LUM-2X4-10FT', in_stock: 120, unit_cost: 10.50, safety_stock: 25 },
      { name: 'Drywall Sheet - 4x8', sku: 'DW-4X8-STD', in_stock: 45, unit_cost: 12.75, safety_stock: 10 },
      { name: 'Drywall Sheet - 4x12', sku: 'DW-4X12-STD', in_stock: 30, unit_cost: 18.50, safety_stock: 10 },
      { name: 'Concrete Mix - 80lb', sku: 'CONC-80LB', in_stock: 85, unit_cost: 6.25, safety_stock: 20 },
      { name: 'Roofing Shingles - Bundle', sku: 'ROOF-SH-BDL', in_stock: 200, unit_cost: 35.00, safety_stock: 50 },
      { name: 'Insulation Batts - R13', sku: 'INS-R13-BATT', in_stock: 75, unit_cost: 28.50, safety_stock: 15 },
      { name: 'Insulation Batts - R19', sku: 'INS-R19-BATT', in_stock: 60, unit_cost: 32.00, safety_stock: 15 },
      { name: 'PVC Pipe - 1/2"', sku: 'PVC-1-2', in_stock: 180, unit_cost: 3.25, safety_stock: 30 },
      { name: 'PVC Pipe - 3/4"', sku: 'PVC-3-4', in_stock: 150, unit_cost: 4.50, safety_stock: 30 },
      { name: 'Copper Wire - 12 AWG', sku: 'WIRE-CU-12AWG', in_stock: 500, unit_cost: 0.85, safety_stock: 100 },
      { name: 'Copper Wire - 14 AWG', sku: 'WIRE-CU-14AWG', in_stock: 600, unit_cost: 0.65, safety_stock: 100 },
      { name: 'Electrical Outlet - Standard', sku: 'ELEC-OUT-STD', in_stock: 120, unit_cost: 2.50, safety_stock: 25 },
      { name: 'Light Switch - Single Pole', sku: 'ELEC-SW-SP', in_stock: 80, unit_cost: 3.75, safety_stock: 20 },
      { name: 'Paint - White Primer Gallon', sku: 'PAINT-PRIM-WHT-GAL', in_stock: 40, unit_cost: 28.00, safety_stock: 10 },
      { name: 'Paint - Interior White Gallon', sku: 'PAINT-INT-WHT-GAL', in_stock: 35, unit_cost: 32.00, safety_stock: 10 },
      { name: 'Nails - 16d Common', sku: 'NAIL-16D-COMMON', in_stock: 1000, unit_cost: 0.05, safety_stock: 200 },
      { name: 'Screws - Wood #8 2.5"', sku: 'SCRW-WD-8-2.5', in_stock: 800, unit_cost: 0.08, safety_stock: 150 },
      { name: 'Door - Interior 30"', sku: 'DOOR-INT-30', in_stock: 15, unit_cost: 125.00, safety_stock: 5 },
      { name: 'Window - Double Pane 36x48', sku: 'WIN-DP-36X48', in_stock: 12, unit_cost: 180.00, safety_stock: 3 },
    ];

    for (const item of inventoryItems) {
      const allocated = Math.floor(Math.random() * 20);
      const consumed_30d = Math.floor(Math.random() * 50);
      const on_order_local_14d = Math.floor(Math.random() * 30);
      const on_order_shipment_a_60d = Math.floor(Math.random() * 40);
      const on_order_shipment_b_60d = Math.floor(Math.random() * 30);
      const signed_quotations = Math.floor(Math.random() * 25);
      const projected_stock = item.in_stock - allocated - consumed_30d + on_order_local_14d;

      await connection.execute(
        `INSERT INTO inventory_items 
         (id, product_name, sku, in_stock, allocated, consumed_30d, on_order_local_14d, 
          on_order_shipment_a_60d, on_order_shipment_b_60d, signed_quotations, projected_stock, 
          safety_stock, unit_cost, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          uuid(), item.name, item.sku, item.in_stock, allocated, consumed_30d,
          on_order_local_14d, on_order_shipment_a_60d, on_order_shipment_b_60d,
          signed_quotations, projected_stock, item.safety_stock, item.unit_cost
        ]
      );
    }
    console.log(`  ✅ Created ${inventoryItems.length} inventory items`);

    // 4. Seed Product-Vendor Relationships
    console.log('\n🔗 Seeding product-vendor relationships...');
    const [inventoryRows] = await connection.execute('SELECT id FROM inventory_items');
    const vendorIds = vendors.map(v => v.id);
    let productVendorCount = 0;

    for (const product of inventoryRows) {
      // Each product has 1-3 vendors
      const numVendors = Math.floor(Math.random() * 3) + 1;
      const selectedVendors = vendorIds.sort(() => 0.5 - Math.random()).slice(0, numVendors);
      
      for (let i = 0; i < selectedVendors.length; i++) {
        const vendorId = selectedVendors[i];
        const isPrimary = i === 0;
        const unitPrice = (Math.random() * 50 + 5).toFixed(2);
        
        await connection.execute(
          `INSERT INTO product_vendors 
           (id, product_id, vendor_id, is_primary, vendor_sku, unit_price, minimum_order_qty, lead_time_days, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            uuid(), product.id, vendorId, isPrimary, 
            `VND-${product.id.substring(0, 8)}`, unitPrice, 
            Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 20) + 5
          ]
        );
        productVendorCount++;
      }
    }
    console.log(`  ✅ Created ${productVendorCount} product-vendor relationships`);

    // 5. Seed Projects
    console.log('\n🏗️  Seeding projects...');
    const projects = [
      { name: 'Sunset Condos - Phase 1', location: '123 Main St, Miami, FL', status: 'active' },
      { name: 'Ocean View Apartments', location: '456 Beach Blvd, Miami, FL', status: 'active' },
      { name: 'Downtown Lofts', location: '789 City Ave, Miami, FL', status: 'active' },
      { name: 'Riverside Complex', location: '321 River Rd, Miami, FL', status: 'on_hold' },
      { name: 'Harbor Heights', location: '654 Harbor St, Miami, FL', status: 'completed' },
    ];

    const projectIds = [];
    for (const project of projects) {
      const projectId = uuid();
      projectIds.push(projectId);
      await connection.execute(
        `INSERT INTO projects (id, name, location, status, description, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [projectId, project.name, project.location, project.status, `Construction project at ${project.location}`]
      );
    }
    console.log(`  ✅ Created ${projects.length} projects`);

    // 6. Seed User Profiles
    console.log('\n👥 Seeding user profiles...');
    const users = [
      { name: 'John Admin', email: 'john.admin@company.com', role: 'ceo_admin' },
      { name: 'Sarah Warehouse', email: 'sarah.warehouse@company.com', role: 'warehouse_admin' },
      { name: 'Mike Onsite', email: 'mike.onsite@company.com', role: 'onsite_team' },
      { name: 'Lisa Manager', email: 'lisa.manager@company.com', role: 'warehouse_admin' },
      { name: 'Tom Builder', email: 'tom.builder@company.com', role: 'onsite_team' },
    ];

    const userIds = [];
    for (const user of users) {
      const userId = uuid();
      userIds.push(userId);
      await connection.execute(
        `INSERT INTO user_profiles (id, name, email, role, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [userId, user.name, user.email, user.role]
      );
    }
    console.log(`  ✅ Created ${users.length} user profiles`);

    // 7. Seed User Projects
    console.log('\n👤 Seeding user-project assignments...');
    for (const userId of userIds) {
      const assignedProjects = projectIds.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
      for (const projectId of assignedProjects) {
        await connection.execute(
          `INSERT INTO user_projects (id, user_id, project_id, created_at) 
           VALUES (?, ?, ?, NOW())`,
          [uuid(), userId, projectId]
        );
      }
    }
    console.log(`  ✅ Created user-project assignments`);

    // 8. Seed Internal Requests
    console.log('\n📝 Seeding internal requests...');
    const requestStatuses = ['pending', 'fulfilled', 'cancelled'];
    const requestIds = [];
    
    for (let i = 0; i < 10; i++) {
      const requestId = uuid();
      requestIds.push(requestId);
      const status = random(requestStatuses);
      const requester = random(users);
      const projectId = random(projectIds);
      
      await connection.execute(
        `INSERT INTO internal_requests 
         (id, request_number, requester_name, requester_email, destination_property, 
          status, notes, fulfilled_date, project_id, created_by_role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          requestId, `REQ-2024-${String(i + 1).padStart(4, '0')}`, 
          requester.name, requester.email, `Property ${i + 1}`,
          status, `Request for materials - ${status}`, 
          status === 'fulfilled' ? randomDate() : null,
          projectId, requester.role
        ]
      );
    }
    console.log(`  ✅ Created ${requestIds.length} internal requests`);

    // 9. Seed Request Items
    console.log('\n📋 Seeding request items...');
    for (const requestId of requestIds) {
      const numItems = Math.floor(Math.random() * 5) + 1;
      const selectedProducts = inventoryRows.sort(() => 0.5 - Math.random()).slice(0, numItems);
      
      for (const product of selectedProducts) {
        await connection.execute(
          `INSERT INTO request_items 
           (id, request_id, product_id, quantity_requested, quantity_fulfilled, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            uuid(), requestId, product.id, 
            Math.floor(Math.random() * 50) + 10,
            Math.floor(Math.random() * 30) + 5
          ]
        );
      }
    }
    console.log(`  ✅ Created request items`);

    // 10. Seed Claims
    console.log('\n📦 Seeding claims...');
    const claimStatuses = ['pending', 'approved', 'rejected', 'fulfilled'];
    const claimIds = [];
    
    for (let i = 0; i < 8; i++) {
      const claimId = uuid();
      claimIds.push(claimId);
      const status = random(claimStatuses);
      const projectId = random(projectIds);
      const user = random(users);
      
      await connection.execute(
        `INSERT INTO claims 
         (id, claim_number, project_id, onsite_user_name, status, notes, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          claimId, `CLM-2024-${String(i + 1).padStart(4, '0')}`, 
          projectId, user.name, status, `Claim ${i + 1} - ${status}`
        ]
      );
    }
    console.log(`  ✅ Created ${claimIds.length} claims`);

    // 11. Seed Claim Items
    console.log('\n📋 Seeding claim items...');
    for (const claimId of claimIds) {
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = inventoryRows.sort(() => 0.5 - Math.random()).slice(0, numItems);
      
      for (const product of selectedProducts) {
        await connection.execute(
          `INSERT INTO claim_items 
           (id, claim_id, product_id, quantity_requested, quantity_approved, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            uuid(), claimId, product.id, 
            Math.floor(Math.random() * 30) + 5,
            Math.floor(Math.random() * 25) + 3
          ]
        );
      }
    }
    console.log(`  ✅ Created claim items`);

    // 12. Seed Notifications
    console.log('\n🔔 Seeding notifications...');
    const notificationTypes = ['claim_created', 'request_fulfilled', 'stock_low', 'claim_approved', 'system'];
    
    for (let i = 0; i < 15; i++) {
      const notificationType = random(notificationTypes);
      const user = random(users);
      const isRead = Math.random() > 0.5;
      
      await connection.execute(
        `INSERT INTO notifications 
         (id, recipient_user_id, recipient_role, notification_type, message, is_read, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          uuid(), user.email, user.role, notificationType,
          `This is a ${notificationType} notification - Notification ${i + 1}`, isRead
        ]
      );
    }
    console.log(`  ✅ Created 15 notifications`);

    // 13. Seed Audit Logs
    console.log('\n📊 Seeding audit logs...');
    const actionTypes = ['create', 'update', 'delete', 'approve', 'reject'];
    
    for (let i = 0; i < 20; i++) {
      const user = random(users);
      const actionType = random(actionTypes);
      
      await connection.execute(
        `INSERT INTO audit_logs 
         (id, timestamp, user_name, user_role, action_type, action_description, 
          related_entity_type, related_entity_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          uuid(), randomDate(), user.name, user.role, actionType,
          `${actionType} action performed`, 'inventory_item', random(inventoryRows).id
        ]
      );
    }
    console.log(`  ✅ Created 20 audit logs`);

    await connection.commit();
    console.log('\n✅ All dummy data seeded successfully!\n');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error seeding data:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run the seed function
seedData()
  .then(() => {
    console.log('🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

