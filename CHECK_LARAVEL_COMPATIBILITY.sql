-- ============================================================================
-- Check Laravel Compatibility
-- ============================================================================
-- Run this in your AWS database to check Laravel's conventions
-- ============================================================================

-- Check ID types in existing Laravel tables
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME = 'id'
AND TABLE_NAME IN (
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
    LIMIT 10
)
ORDER BY TABLE_NAME;

-- Check if Laravel uses UUIDs or integers
SELECT 
    TABLE_NAME,
    CASE 
        WHEN DATA_TYPE = 'char' AND CHARACTER_MAXIMUM_LENGTH = 36 THEN 'UUID'
        WHEN DATA_TYPE IN ('int', 'bigint') AND EXTRA LIKE '%auto_increment%' THEN 'INTEGER'
        ELSE 'OTHER'
    END as id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME = 'id'
AND COLUMN_KEY = 'PRI'
LIMIT 10;

-- Check timestamp columns (Laravel standard)
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME IN ('created_at', 'updated_at')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- List all tables to see naming convention
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

