-- ============================================================================
-- NEW TABLES ONLY - For Adding to AWS Main Database
-- ============================================================================
-- This file contains ONLY the new tables from the Live Claim System
-- Run this on your AWS main database to add the new tables
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- LIVE CLAIM SYSTEM TABLES
-- ============================================================================

-- project_templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_template_items table
CREATE TABLE IF NOT EXISTS project_template_items (
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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
  id CHAR(36) PRIMARY KEY,
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

