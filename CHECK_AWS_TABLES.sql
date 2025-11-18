-- ============================================================================
-- Check Existing Tables in AWS Database
-- ============================================================================
-- Run this in your AWS database to see what tables exist
-- ============================================================================

-- List all tables
SHOW TABLES;

-- Get detailed table information
SELECT
    TABLE_NAME,
    TABLE_TYPE,
    ENGINE,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- Check for specific tables the application needs
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'inventory_items' as table_name
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'inventory_items'
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END,
    'notifications'
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'notifications'
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END,
    'claims'
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'claims'
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END,
    'returns'
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'returns'
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END,
    'project_templates'
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_templates'
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END,
    'project_materials'
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_materials'
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END,
    'stock_adjustments'
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'stock_adjustments';

-- Check for possible name variations
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND (
        TABLE_NAME LIKE '%inventory%'
        OR TABLE_NAME LIKE '%product%'
        OR TABLE_NAME LIKE '%item%'
        OR TABLE_NAME LIKE '%request%'
        OR TABLE_NAME LIKE '%order%'
        OR TABLE_NAME LIKE '%project%'
        OR TABLE_NAME LIKE '%vendor%'
        OR TABLE_NAME LIKE '%user%'
        OR TABLE_NAME LIKE '%audit%'
        OR TABLE_NAME LIKE '%notification%'
    )
ORDER BY TABLE_NAME;