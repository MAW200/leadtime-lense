# MySQL Schema Summary

## Files Created

1. **`mysql_schema.sql`** - Complete MySQL database schema with:
   - All 20+ tables (vendors, inventory_items, projects, claims, returns, etc.)
   - Foreign key relationships
   - Indexes for performance
   - Stored functions for generating unique numbers
   - Triggers for auto-updating timestamps
   - CHECK constraints for data validation

2. **`MYSQL_MIGRATION_GUIDE.md`** - Comprehensive migration guide with:
   - Differences between PostgreSQL and MySQL
   - Potential issues and solutions
   - Required code changes
   - Testing checklist

## Quick Start

1. **Run the schema file**:
   ```bash
   mysql -u your_user -p your_database < mysql_schema.sql
   ```

2. **Verify tables were created**:
   ```sql
   SHOW TABLES;
   ```

3. **Test a function**:
   ```sql
   SELECT generate_claim_number();
   ```

## All Tables Included

### Core Inventory
- `vendors` - Supplier information
- `inventory_items` - Product inventory
- `product_vendors` - Product-vendor relationships

### Requests & Orders
- `internal_requests` - Internal material requests
- `request_items` - Request line items
- `purchase_orders` - Purchase orders
- `purchase_order_items` - PO line items

### Projects & Audit
- `projects` - Project/condo information
- `audit_logs` - System audit trail
- `user_profiles` - User information

### Live Claim System
- `project_templates` - Reusable BOM templates
- `project_template_items` - Template items
- `project_materials` - Project BOM with claimed quantities
- `claims` - Material claims
- `claim_items` - Claim line items
- `returns` - Damaged goods returns
- `return_items` - Return line items
- `stock_adjustments` - Manual inventory adjustments
- `notifications` - System notifications
- `user_projects` - User-project assignments

## Key Features

✅ **Complete Structure**: All tables, columns, FKs, indexes included  
✅ **Functions**: Number generation functions converted to MySQL  
✅ **Triggers**: Auto-update timestamps working  
✅ **Constraints**: CHECK constraints, UNIQUE constraints, ENUMs  
✅ **Indexes**: Performance indexes on all foreign keys and frequently queried columns  

## Critical Migration Points

⚠️ **UUID Generation**: Must generate UUIDs in application code (not in database)  
⚠️ **RLS**: Not supported - implement security at application level  
⚠️ **Function Calls**: Update `.rpc()` calls to use SQL queries  
⚠️ **JSON Queries**: Update syntax from PostgreSQL to MySQL  
⚠️ **Timezones**: Handle timezones explicitly in application code  

## Next Steps

1. ✅ Import `mysql_schema.sql` into your MySQL database
2. ⚠️ Update application code to use MySQL client library
3. ⚠️ Replace Supabase client with MySQL client (mysql2, Prisma, TypeORM, etc.)
4. ⚠️ Update all function calls (RPC → SQL)
5. ⚠️ Implement application-level security (replace RLS)
6. ⚠️ Test all functionality

## Support

See `MYSQL_MIGRATION_GUIDE.md` for detailed migration instructions and troubleshooting.

