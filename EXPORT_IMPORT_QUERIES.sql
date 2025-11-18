-- ============================================================================
-- SQL QUERIES FOR EXPORTING DATA FROM AWS MAIN DATABASE
-- ============================================================================
-- Run these queries on your AWS main database to export existing data
-- ============================================================================

-- 1. EXPORT VENDORS
SELECT 
  id,
  name,
  contact_email,
  contact_phone,
  lead_time_days,
  country,
  is_active,
  created_at,
  updated_at
FROM vendors
ORDER BY name;

-- 2. EXPORT INVENTORY ITEMS
SELECT 
  id,
  product_name,
  sku,
  in_stock,
  allocated,
  consumed_30d,
  on_order_local_14d,
  on_order_shipment_a_60d,
  on_order_shipment_b_60d,
  signed_quotations,
  projected_stock,
  safety_stock,
  unit_cost,
  created_at,
  updated_at
FROM inventory_items
ORDER BY product_name;

-- 3. EXPORT PRODUCT VENDORS
SELECT 
  id,
  product_id,
  vendor_id,
  is_primary,
  vendor_sku,
  unit_price,
  minimum_order_qty,
  lead_time_days,
  last_order_date,
  created_at,
  updated_at
FROM product_vendors
ORDER BY product_id, is_primary DESC;

-- 4. EXPORT PROJECTS
SELECT 
  id,
  name,
  location,
  status,
  description,
  created_at,
  updated_at
FROM projects
ORDER BY created_at DESC;

-- 5. EXPORT USER PROFILES
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at,
  updated_at
FROM user_profiles
ORDER BY role, name;

-- 6. EXPORT INTERNAL REQUESTS
SELECT 
  id,
  request_number,
  requester_name,
  requester_email,
  destination_property,
  status,
  notes,
  fulfilled_date,
  project_id,
  photo_url,
  created_by_role,
  created_at,
  updated_at
FROM internal_requests
ORDER BY created_at DESC;

-- 7. EXPORT REQUEST ITEMS
SELECT 
  id,
  request_id,
  product_id,
  quantity_requested,
  quantity_fulfilled,
  created_at
FROM request_items
ORDER BY request_id, created_at;

-- 8. EXPORT PURCHASE ORDERS
SELECT 
  id,
  po_number,
  vendor_id,
  status,
  total_amount,
  order_date,
  expected_delivery_date,
  actual_delivery_date,
  notes,
  created_by,
  good_quality_qty,
  bad_quality_qty,
  qa_photo_url,
  qa_completed_at,
  qa_completed_by,
  created_at,
  updated_at
FROM purchase_orders
ORDER BY created_at DESC;

-- 9. EXPORT PURCHASE ORDER ITEMS
SELECT 
  id,
  po_id,
  product_id,
  quantity,
  unit_price,
  subtotal,
  created_at
FROM purchase_order_items
ORDER BY po_id, created_at;

-- 10. EXPORT AUDIT LOGS (OPTIONAL - Historical data)
SELECT 
  id,
  timestamp,
  user_name,
  user_role,
  action_type,
  action_description,
  related_entity_type,
  related_entity_id,
  photo_url,
  metadata,
  created_at
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 10000; -- Adjust limit as needed

-- ============================================================================
-- NEW TABLES TO CREATE IN AWS MAIN DATABASE
-- ============================================================================
-- These tables need to be created in your AWS database
-- Run the CREATE TABLE statements from mysql_schema.sql for these tables:
-- ============================================================================

-- NEW TABLES (from Live Claim System):
-- 1. project_templates
-- 2. project_template_items
-- 3. project_materials
-- 4. claims
-- 5. claim_items
-- 6. returns
-- 7. return_items
-- 8. stock_adjustments
-- 9. notifications
-- 10. user_projects

-- ============================================================================
-- MINIMUM REQUIRED DATA TO START APPLICATION
-- ============================================================================

-- After importing existing data, create minimum required data:

-- 1. Create at least 1 project template
INSERT INTO project_templates (id, name, description, is_active) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', 'Standard Condo Template', 'Standard materials for condo projects', TRUE);

-- 2. Add items to the template (replace product_id with actual IDs from inventory_items)
INSERT INTO project_template_items (id, template_id, product_id, phase, required_quantity) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', 'aa0e8400-e29b-41d4-a716-446655440000', 'YOUR_PRODUCT_ID_1', 'P1', 50),
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440000', 'YOUR_PRODUCT_ID_2', 'P1', 100);

-- 3. Create project materials for at least 1 project (replace project_id and product_id)
INSERT INTO project_materials (id, project_id, product_id, phase, required_quantity, claimed_quantity) VALUES
('cc0e8400-e29b-41d4-a716-446655440000', 'YOUR_PROJECT_ID', 'YOUR_PRODUCT_ID_1', 'P1', 50, 0),
('cc0e8400-e29b-41d4-a716-446655440001', 'YOUR_PROJECT_ID', 'YOUR_PRODUCT_ID_2', 'P1', 100, 0);

-- 4. Assign onsite team members to projects
INSERT INTO user_projects (id, user_id, project_id) VALUES
('ee0e8400-e29b-41d4-a716-446655440000', 'YOUR_ONSITE_USER_ID', 'YOUR_PROJECT_ID');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables exist
SHOW TABLES;

-- Count records in each table
SELECT 'vendors' as table_name, COUNT(*) as count FROM vendors
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items
UNION ALL
SELECT 'product_vendors', COUNT(*) FROM product_vendors
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'project_templates', COUNT(*) FROM project_templates
UNION ALL
SELECT 'project_template_items', COUNT(*) FROM project_template_items
UNION ALL
SELECT 'project_materials', COUNT(*) FROM project_materials
UNION ALL
SELECT 'claims', COUNT(*) FROM claims
UNION ALL
SELECT 'returns', COUNT(*) FROM returns
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'user_projects', COUNT(*) FROM user_projects;

-- Verify foreign key relationships
SELECT 
  p.name as project_name,
  COUNT(pm.id) as material_count
FROM projects p
LEFT JOIN project_materials pm ON p.id = pm.project_id
GROUP BY p.id, p.name;

-- Check for users with each role
SELECT role, COUNT(*) as count
FROM user_profiles
WHERE is_active = TRUE
GROUP BY role;

