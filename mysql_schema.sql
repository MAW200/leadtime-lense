-- ============================================================================
-- MySQL Schema for Leadtime Lense Inventory Management System
-- ============================================================================
-- This file contains the complete database structure converted from PostgreSQL
-- to MySQL. All tables, indexes, foreign keys, and functions are included.
--
-- IMPORTANT NOTES:
-- 1. MySQL doesn't support Row Level Security (RLS) - handle at application level
-- 2. UUIDs are stored as CHAR(36) instead of native UUID type
--    NOTE: UUIDs must be generated in application code (e.g., UUID() in Node.js)
--    MySQL doesn't support UUID() as DEFAULT value in older versions
-- 3. Timestamps use DATETIME instead of TIMESTAMPTZ
-- 4. JSON columns use JSON type instead of JSONB
-- 5. Functions use MySQL stored procedure syntax
-- 6. Triggers use MySQL trigger syntax
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================================
-- CORE INVENTORY TABLES
-- ============================================================================

-- vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  lead_time_days INT DEFAULT 14,
  country TEXT DEFAULT 'USA',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendors_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(36) PRIMARY KEY ,
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

-- product_vendors junction table
CREATE TABLE IF NOT EXISTS product_vendors (
  id CHAR(36) PRIMARY KEY ,
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

-- ============================================================================
-- REQUESTS AND PURCHASE ORDERS
-- ============================================================================

-- internal_requests table
CREATE TABLE IF NOT EXISTS internal_requests (
  id CHAR(36) PRIMARY KEY ,
  request_number VARCHAR(255) UNIQUE NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT,
  destination_property TEXT NOT NULL,
  status ENUM('pending', 'fulfilled', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  fulfilled_date DATETIME,
  project_id CHAR(36),
  photo_url TEXT,
  created_by_role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_internal_requests_status (status),
  INDEX idx_internal_requests_created_at (created_at DESC),
  INDEX idx_internal_requests_project_id (project_id),
  INDEX idx_internal_requests_created_by_role (created_by_role),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- request_items junction table
CREATE TABLE IF NOT EXISTS request_items (
  id CHAR(36) PRIMARY KEY ,
  request_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity_requested INT NOT NULL DEFAULT 1,
  quantity_fulfilled INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_request_product (request_id, product_id),
  INDEX idx_request_items_request_id (request_id),
  INDEX idx_request_items_product_id (product_id),
  FOREIGN KEY (request_id) REFERENCES internal_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id CHAR(36) PRIMARY KEY ,
  po_number VARCHAR(255) UNIQUE NOT NULL,
  vendor_id CHAR(36) NOT NULL,
  status ENUM('draft', 'sent', 'in_transit', 'received', 'cancelled') DEFAULT 'draft',
  total_amount DECIMAL(12,2) DEFAULT 0,
  order_date DATETIME,
  expected_delivery_date DATETIME,
  actual_delivery_date DATETIME,
  notes TEXT,
  created_by TEXT,
  good_quality_qty INT DEFAULT 0,
  bad_quality_qty INT DEFAULT 0,
  qa_photo_url TEXT,
  qa_completed_at DATETIME,
  qa_completed_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_purchase_orders_vendor_id (vendor_id),
  INDEX idx_purchase_orders_status (status),
  INDEX idx_purchase_orders_order_date (order_date DESC),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- purchase_order_items junction table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id CHAR(36) PRIMARY KEY ,
  po_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_po_product (po_id, product_id),
  INDEX idx_po_items_po_id (po_id),
  INDEX idx_po_items_product_id (product_id),
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PROJECTS AND AUDIT SYSTEM
-- ============================================================================

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY ,
  name TEXT NOT NULL,
  location TEXT,
  status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY ,
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

-- user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id CHAR(36) PRIMARY KEY ,
  name TEXT NOT NULL,
  email VARCHAR(255) UNIQUE,
  role ENUM('ceo_admin', 'warehouse_admin', 'onsite_team') DEFAULT 'onsite_team',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_profiles_email (email),
  INDEX idx_user_profiles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- LIVE CLAIM SYSTEM TABLES
-- ============================================================================

-- project_templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id CHAR(36) PRIMARY KEY ,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_template_items table
CREATE TABLE IF NOT EXISTS project_template_items (
  id CHAR(36) PRIMARY KEY ,
  template_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  phase ENUM('P1', 'P2a', 'P2b') NOT NULL,
  required_quantity INT NOT NULL DEFAULT 0 CHECK (required_quantity >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_template_items_template_id (template_id),
  INDEX idx_project_template_items_product_id (product_id),
  FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_materials table
CREATE TABLE IF NOT EXISTS project_materials (
  id CHAR(36) PRIMARY KEY ,
  project_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  phase ENUM('P1', 'P2a', 'P2b') NOT NULL,
  required_quantity INT NOT NULL DEFAULT 0 CHECK (required_quantity >= 0),
  claimed_quantity INT NOT NULL DEFAULT 0 CHECK (claimed_quantity >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_product_phase (project_id, product_id, phase),
  INDEX idx_project_materials_project_id (project_id),
  INDEX idx_project_materials_product_id (product_id),
  INDEX idx_project_materials_phase (phase),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- claims table
CREATE TABLE IF NOT EXISTS claims (
  id CHAR(36) PRIMARY KEY ,
  claim_number VARCHAR(255) UNIQUE NOT NULL,
  project_id CHAR(36) NOT NULL,
  onsite_user_id TEXT NOT NULL,
  onsite_user_name TEXT NOT NULL,
  warehouse_admin_id TEXT,
  warehouse_admin_name TEXT,
  status ENUM('pending', 'approved', 'partial_approved', 'denied') DEFAULT 'pending',
  claim_type ENUM('standard', 'emergency') DEFAULT 'standard',
  photo_url TEXT NOT NULL,
  emergency_reason TEXT,
  denial_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  processed_at DATETIME,
  INDEX idx_claims_project_id (project_id),
  INDEX idx_claims_status (status),
  INDEX idx_claims_claim_type (claim_type),
  INDEX idx_claims_onsite_user_id (onsite_user_id(255)),
  INDEX idx_claims_created_at (created_at DESC),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- claim_items table
CREATE TABLE IF NOT EXISTS claim_items (
  id CHAR(36) PRIMARY KEY ,
  claim_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity_requested INT NOT NULL CHECK (quantity_requested > 0),
  quantity_approved INT DEFAULT 0 CHECK (quantity_approved >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_claim_items_claim_id (claim_id),
  INDEX idx_claim_items_product_id (product_id),
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- returns table
CREATE TABLE IF NOT EXISTS returns (
  id CHAR(36) PRIMARY KEY ,
  return_number VARCHAR(255) UNIQUE NOT NULL,
  project_id CHAR(36) NOT NULL,
  claim_id CHAR(36),
  onsite_user_id TEXT NOT NULL,
  onsite_user_name TEXT NOT NULL,
  warehouse_admin_id TEXT,
  warehouse_admin_name TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reason TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  INDEX idx_returns_project_id (project_id),
  INDEX idx_returns_claim_id (claim_id),
  INDEX idx_returns_status (status),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- return_items table
CREATE TABLE IF NOT EXISTS return_items (
  id CHAR(36) PRIMARY KEY ,
  return_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_return_items_return_id (return_id),
  FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- stock_adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id CHAR(36) PRIMARY KEY ,
  adjustment_number VARCHAR(255) UNIQUE NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity_change INT NOT NULL CHECK (quantity_change != 0),
  reason TEXT NOT NULL,
  notes TEXT,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stock_adjustments_product_id (product_id),
  INDEX idx_stock_adjustments_created_at (created_at DESC),
  FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY ,
  recipient_user_id TEXT NOT NULL,
  recipient_role ENUM('ceo_admin', 'warehouse_admin', 'onsite_team') NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  related_claim_id CHAR(36),
  related_return_id CHAR(36),
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_recipient_user_id (recipient_user_id(255)),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created_at (created_at DESC),
  FOREIGN KEY (related_claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  FOREIGN KEY (related_return_id) REFERENCES returns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_projects table
CREATE TABLE IF NOT EXISTS user_projects (
  id CHAR(36) PRIMARY KEY ,
  user_id TEXT NOT NULL,
  project_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_project (user_id(255), project_id),
  INDEX idx_user_projects_user_id (user_id(255)),
  INDEX idx_user_projects_project_id (project_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- STORED FUNCTIONS FOR GENERATING UNIQUE NUMBERS
-- ============================================================================

DELIMITER //

-- Function to generate unique claim numbers (CLM-YYYY-####)
DROP FUNCTION IF EXISTS generate_claim_number//
CREATE FUNCTION generate_claim_number()
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(255);
  DECLARE max_number INT DEFAULT 0;
  DECLARE current_year VARCHAR(4);
  
  SET current_year = YEAR(CURRENT_DATE);
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number, 10) AS UNSIGNED)), 0)
  INTO max_number
  FROM claims
  WHERE claim_number LIKE CONCAT('CLM-', current_year, '-%');
  
  SET new_number = CONCAT('CLM-', current_year, '-', LPAD((max_number + 1), 4, '0'));
  
  RETURN new_number;
END//

-- Function to generate unique return numbers (RET-YYYY-####)
DROP FUNCTION IF EXISTS generate_return_number//
CREATE FUNCTION generate_return_number()
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(255);
  DECLARE max_number INT DEFAULT 0;
  DECLARE current_year VARCHAR(4);
  
  SET current_year = YEAR(CURRENT_DATE);
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number, 10) AS UNSIGNED)), 0)
  INTO max_number
  FROM returns
  WHERE return_number LIKE CONCAT('RET-', current_year, '-%');
  
  SET new_number = CONCAT('RET-', current_year, '-', LPAD((max_number + 1), 4, '0'));
  
  RETURN new_number;
END//

-- Function to generate unique adjustment numbers (ADJ-YYYY-####)
DROP FUNCTION IF EXISTS generate_adjustment_number//
CREATE FUNCTION generate_adjustment_number()
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(255);
  DECLARE max_number INT DEFAULT 0;
  DECLARE current_year VARCHAR(4);
  
  SET current_year = YEAR(CURRENT_DATE);
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(adjustment_number, 10) AS UNSIGNED)), 0)
  INTO max_number
  FROM stock_adjustments
  WHERE adjustment_number LIKE CONCAT('ADJ-', current_year, '-%');
  
  SET new_number = CONCAT('ADJ-', current_year, '-', LPAD((max_number + 1), 4, '0'));
  
  RETURN new_number;
END//

-- Function to generate request numbers (REQ-####)
DROP FUNCTION IF EXISTS generate_request_number//
CREATE FUNCTION generate_request_number()
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(255);
  DECLARE max_number INT DEFAULT 0;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number, 5) AS UNSIGNED)), 0) + 1
  INTO max_number
  FROM internal_requests;
  
  SET new_number = CONCAT('REQ-', LPAD(max_number, 4, '0'));
  
  RETURN new_number;
END//

-- Function to generate PO numbers (PO-####)
DROP FUNCTION IF EXISTS generate_po_number//
CREATE FUNCTION generate_po_number()
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(255);
  DECLARE max_number INT DEFAULT 1000;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number, 4) AS UNSIGNED)), 1000) + 1
  INTO max_number
  FROM purchase_orders;
  
  SET new_number = CONCAT('PO-', max_number);
  
  RETURN new_number;
END//

DELIMITER ;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

DELIMITER //

-- Trigger for project_templates updated_at
DROP TRIGGER IF EXISTS update_project_templates_updated_at//
CREATE TRIGGER update_project_templates_updated_at
BEFORE UPDATE ON project_templates
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Trigger for project_materials updated_at
DROP TRIGGER IF EXISTS update_project_materials_updated_at//
CREATE TRIGGER update_project_materials_updated_at
BEFORE UPDATE ON project_materials
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Trigger for claims updated_at
DROP TRIGGER IF EXISTS update_claims_updated_at//
CREATE TRIGGER update_claims_updated_at
BEFORE UPDATE ON claims
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - REMOVE IF NOT NEEDED)
-- ============================================================================

-- Insert sample projects
INSERT INTO projects (id, name, location, status, description) VALUES
  (UUID(), 'Project A - Condo', 'Downtown District', 'active', 'Luxury condominium renovation project'),
  (UUID(), 'Project B - Subang', 'Subang Jaya', 'active', 'Commercial office space renovation'),
  (UUID(), 'Project C - Villa', 'Damansara Heights', 'on_hold', 'Private villa restoration')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

