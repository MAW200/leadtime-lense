# MySQL Migration Guide

## Overview
This document outlines the complete database schema for the Leadtime Lense Inventory Management System, converted from PostgreSQL to MySQL, and highlights potential migration issues and solutions.

## Schema File
The complete MySQL schema is provided in `mysql_schema.sql`. This file contains:
- All 20+ tables with proper structure
- Foreign key relationships
- Indexes for performance
- Stored functions for generating unique numbers
- Triggers for auto-updating timestamps
- CHECK constraints for data validation

## Key Differences: PostgreSQL → MySQL

### 1. **UUID Handling**
- **PostgreSQL**: Native `uuid` type with `gen_random_uuid()`
- **MySQL**: `CHAR(36)` with `UUID()` function
- **Impact**: ✅ No code changes needed - both store UUIDs as strings

### 2. **Timestamps**
- **PostgreSQL**: `timestamptz` (timezone-aware)
- **MySQL**: `DATETIME` (timezone-naive) or `TIMESTAMP` (timezone-aware)
- **Impact**: ⚠️ **POTENTIAL ISSUE** - Application must handle timezones explicitly
- **Solution**: Use `DATETIME` and handle timezones in application code, or use `TIMESTAMP` which auto-converts to UTC

### 3. **Text Types**
- **PostgreSQL**: `text` (unlimited length)
- **MySQL**: `TEXT` (up to 65,535 bytes) or `LONGTEXT` (up to 4GB)
- **Impact**: ✅ No issues - `TEXT` is sufficient for most use cases

### 4. **Boolean Types**
- **PostgreSQL**: Native `boolean` (TRUE/FALSE)
- **MySQL**: `BOOLEAN` (alias for `TINYINT(1)`) - stores 0/1
- **Impact**: ✅ No code changes needed - both work the same way

### 5. **JSON Storage**
- **PostgreSQL**: `jsonb` (binary JSON with indexing)
- **MySQL**: `JSON` (text-based JSON with indexing)
- **Impact**: ⚠️ **MINOR PERFORMANCE DIFFERENCE** - MySQL JSON is slightly slower but still efficient
- **Solution**: Both support JSON queries, but MySQL syntax differs slightly

### 6. **Row Level Security (RLS)**
- **PostgreSQL**: Native RLS with policies
- **MySQL**: ❌ **NOT SUPPORTED**
- **Impact**: ⚠️ **CRITICAL** - Security must be handled at application level
- **Solution**: Implement access control in your application middleware/API layer

### 7. **Stored Functions**
- **PostgreSQL**: `plpgsql` language
- **MySQL**: MySQL stored procedure syntax
- **Impact**: ✅ Functions converted - syntax differs but functionality preserved
- **Note**: All number generation functions (`generate_claim_number`, `generate_return_number`, etc.) are converted

### 8. **Triggers**
- **PostgreSQL**: `plpgsql` trigger functions
- **MySQL**: MySQL trigger syntax
- **Impact**: ✅ Triggers converted - `updated_at` auto-update triggers work the same

### 9. **CHECK Constraints**
- **PostgreSQL**: Full CHECK constraint support
- **MySQL**: CHECK constraints supported (MySQL 8.0.16+)
- **Impact**: ✅ No issues if using MySQL 8.0.16 or later

### 10. **Generated Columns**
- **PostgreSQL**: `GENERATED ALWAYS AS ... STORED`
- **MySQL**: `GENERATED ALWAYS AS ... STORED`
- **Impact**: ✅ Same syntax - no issues

### 11. **ENUM Types**
- **PostgreSQL**: Uses CHECK constraints
- **MySQL**: Native ENUM type
- **Impact**: ✅ Better performance in MySQL with native ENUM

## Potential Migration Issues & Solutions

### ⚠️ Issue 1: Row Level Security (RLS)
**Problem**: MySQL doesn't support RLS. All PostgreSQL RLS policies are removed.

**Solution**: 
- Implement access control in your application layer
- Use middleware to check user roles before database queries
- Consider using MySQL views with `DEFINER` security for read-only access control

**Example Application-Level Check**:
```typescript
// In your API/hooks
if (userRole !== 'ceo_admin' && userRole !== 'warehouse_admin') {
  throw new Error('Unauthorized');
}
```

### ⚠️ Issue 2: Function Calls via RPC
**Problem**: Supabase uses `.rpc()` to call database functions. MySQL doesn't have the same RPC mechanism.

**Solution**: 
- **Option A**: Call functions directly via SQL: `SELECT generate_claim_number()`
- **Option B**: Use MySQL stored procedures instead of functions
- **Option C**: Generate numbers in application code (not recommended for uniqueness)

**Code Change Required**:
```typescript
// Before (Supabase)
const { data } = await supabase.rpc('generate_claim_number');

// After (MySQL)
const { data } = await supabase.from('_functions').select('generate_claim_number()');
// OR use raw SQL query
const { data } = await supabase.rpc('generate_claim_number'); // If your MySQL client supports it
```

**Recommended**: Check if your MySQL client library supports calling functions. If not, you may need to:
1. Create a wrapper table/view
2. Use raw SQL queries
3. Move number generation to application code with database locking

### ⚠️ Issue 3: Timezone Handling
**Problem**: PostgreSQL `timestamptz` automatically handles timezones. MySQL `DATETIME` doesn't.

**Solution**:
- Store all times in UTC in the database
- Convert to user's timezone in application code
- Or use MySQL `TIMESTAMP` type which auto-converts to UTC

**Code Change**:
```typescript
// Ensure all dates are stored in UTC
const now = new Date().toISOString(); // Already in UTC format
```

### ⚠️ Issue 4: JSON Query Syntax
**Problem**: PostgreSQL and MySQL have different JSON query syntaxes.

**PostgreSQL**:
```sql
SELECT metadata->>'claim_number' FROM audit_logs;
```

**MySQL**:
```sql
SELECT JSON_EXTRACT(metadata, '$.claim_number') FROM audit_logs;
-- OR
SELECT metadata->>'$.claim_number' FROM audit_logs; -- MySQL 5.7+
```

**Solution**: Update all JSON queries in your codebase to use MySQL syntax.

### ⚠️ Issue 5: Case Sensitivity
**Problem**: MySQL table/column names are case-sensitive on Linux but not on Windows.

**Solution**: 
- Use lowercase table and column names consistently
- Or configure MySQL to be case-sensitive: `lower_case_table_names=0`

### ⚠️ Issue 6: Foreign Key Constraints
**Problem**: MySQL is stricter about foreign key constraints than PostgreSQL in some cases.

**Solution**: 
- Ensure all referenced tables exist before creating foreign keys
- The schema file uses `SET FOREIGN_KEY_CHECKS = 0` at the start to allow table creation in any order

### ⚠️ Issue 7: String Indexing
**Problem**: MySQL has limitations on indexing TEXT columns.

**Solution**: 
- The schema uses prefix indexes: `INDEX idx_name (column_name(255))`
- This limits index size but may affect some queries
- Consider using `VARCHAR(255)` instead of `TEXT` for indexed columns if possible

## Required Code Changes

### 1. Update Supabase Client Configuration
```typescript
// src/lib/supabase.ts
// Change connection string to MySQL
// Note: Supabase client may not work with MySQL directly
// You may need to use a different MySQL client library
```

**Important**: The Supabase JavaScript client is designed for PostgreSQL. For MySQL, you'll need:
- **Option A**: Use a MySQL client library like `mysql2` or `mysql`
- **Option B**: Use an ORM like Prisma, TypeORM, or Sequelize
- **Option C**: Use a MySQL-compatible API layer

### 2. Update Function Calls
```typescript
// src/hooks/useClaims.ts
// Change from:
const { data } = await supabase.rpc('generate_claim_number');

// To (if using raw MySQL client):
const [rows] = await mysql.execute('SELECT generate_claim_number() AS number');
const claimNumber = rows[0].number;

// OR (if using ORM):
const result = await db.raw('SELECT generate_claim_number() AS number');
const claimNumber = result[0].number;
```

### 3. Update JSON Queries
```typescript
// Change all JSON queries to MySQL syntax
// PostgreSQL: metadata->>'key'
// MySQL: JSON_EXTRACT(metadata, '$.key') or metadata->>'$.key'
```

### 4. Implement Application-Level Security
Since RLS is not available, add middleware/guards:

```typescript
// Example: Add role checking middleware
function requireRole(roles: UserRole[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

## Testing Checklist

After migration, test the following:

- [ ] ✅ All tables created successfully
- [ ] ✅ Foreign keys work correctly
- [ ] ✅ Unique constraints prevent duplicates
- [ ] ✅ CHECK constraints validate data
- [ ] ✅ Number generation functions work (`generate_claim_number`, etc.)
- [ ] ✅ Triggers update `updated_at` timestamps
- [ ] ✅ JSON columns store and retrieve data correctly
- [ ] ✅ ENUM types accept only valid values
- [ ] ✅ Indexes improve query performance
- [ ] ✅ Application-level security prevents unauthorized access
- [ ] ✅ Timezone handling works correctly
- [ ] ✅ All CRUD operations work
- [ ] ✅ Complex queries with JOINs work
- [ ] ✅ Transactions work correctly

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **JSON**: MySQL JSON indexing is available but different from PostgreSQL
3. **ENUM**: MySQL ENUMs are more efficient than CHECK constraints
4. **Connection Pooling**: Ensure proper connection pooling for MySQL

## Recommended MySQL Version

- **Minimum**: MySQL 8.0.16+ (for CHECK constraint support)
- **Recommended**: MySQL 8.0.30+ or MariaDB 10.5+ (for best JSON and performance features)

## Next Steps

1. ✅ Review the `mysql_schema.sql` file
2. ✅ Run the schema file on your MySQL database
3. ⚠️ Update your application code to use MySQL client library
4. ⚠️ Update all function calls (RPC → SQL)
5. ⚠️ Update JSON queries to MySQL syntax
6. ⚠️ Implement application-level security (replace RLS)
7. ⚠️ Test all functionality thoroughly
8. ⚠️ Update environment variables for MySQL connection

## Support

If you encounter issues during migration:
1. Check MySQL error logs
2. Verify MySQL version compatibility
3. Test functions individually
4. Check foreign key constraints
5. Verify timezone settings

---

**Last Updated**: 2024-11-12
**Schema Version**: 1.0.0

