-- ============================================================================
-- Create Missing Tables for AWS Database
-- ============================================================================
-- This script creates ONLY the tables that are missing
-- Run NEW_TABLES_ONLY.sql first, then add any other missing tables here
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- CRITICAL: inventory_items (Currently causing errors)
-- ============================================================================
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
    unit_cost DECIMAL(10, 2) DEFAULT 125.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inventory_items_sku (sku)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================================
-- CRITICAL: notifications (Currently causing errors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    recipient_user_id TEXT NOT NULL,
    recipient_role ENUM(
        'ceo_admin',
        'warehouse_admin',
        'onsite_team'
    ) NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    related_claim_id CHAR(36),
    related_return_id CHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_recipient_user_id (recipient_user_id (255)),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_created_at (created_at DESC),
    FOREIGN KEY (related_claim_id) REFERENCES claims (id) ON DELETE CASCADE,
    FOREIGN KEY (related_return_id) REFERENCES returns (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================================
-- Other tables that might be missing (uncomment if needed)
-- ============================================================================

-- vendors table (if missing)
-- CREATE TABLE IF NOT EXISTS vendors (
--   id CHAR(36) PRIMARY KEY,
--   name TEXT NOT NULL,
--   contact_email TEXT,
--   contact_phone TEXT,
--   lead_time_days INT DEFAULT 14,
--   country TEXT DEFAULT 'USA',
--   is_active BOOLEAN DEFAULT TRUE,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   INDEX idx_vendors_is_active (is_active)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- product_vendors table (if missing)
-- CREATE TABLE IF NOT EXISTS product_vendors (
--   id CHAR(36) PRIMARY KEY,
--   product_id CHAR(36) NOT NULL,
--   vendor_id CHAR(36) NOT NULL,
--   is_primary BOOLEAN DEFAULT FALSE,
--   vendor_sku TEXT,
--   unit_price DECIMAL(10,2) DEFAULT 0,
--   minimum_order_qty INT DEFAULT 1,
--   lead_time_days INT DEFAULT 14,
--   last_order_date DATETIME,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   UNIQUE KEY unique_product_vendor (product_id, vendor_id),
--   INDEX idx_product_vendors_product_id (product_id),
--   INDEX idx_product_vendors_vendor_id (vendor_id),
--   FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
--   FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- projects table (if missing)
-- CREATE TABLE IF NOT EXISTS projects (
--   id CHAR(36) PRIMARY KEY,
--   name TEXT NOT NULL,
--   location TEXT,
--   status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
--   description TEXT,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   INDEX idx_projects_status (status)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Verification: Check if tables were created
-- ============================================================================
SELECT
    'inventory_items' as table_name,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'inventory_items'
UNION ALL
SELECT
    'notifications',
    CASE
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'notifications';