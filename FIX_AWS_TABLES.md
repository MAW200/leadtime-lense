# Fix AWS Database Table Errors

## 🔴 Current Errors

Your application is trying to access tables that don't exist in AWS database `renoxpert-staging-db`:

1. ❌ `inventory_items` - **CRITICAL** - Application can't load inventory
2. ❌ `notifications` - **CRITICAL** - Application can't load notifications

---

## ✅ Quick Fix Steps

### Step 1: Check What Tables Exist in AWS

Run this SQL in your AWS database:

```sql
SHOW TABLES;
```

Or use the provided script: `CHECK_AWS_TABLES.sql`

### Step 2: Create Missing Tables

**Option A: Create Critical Missing Tables Only**

Run `CREATE_MISSING_TABLES.sql` - This creates:
- `inventory_items` (fixes inventory errors)
- `notifications` (fixes notification errors)

**Option B: Create All New Tables**

Run `NEW_TABLES_ONLY.sql` - This creates all 10 new Live Claim System tables including:
- `notifications`
- `claims`
- `returns`
- `project_templates`
- `project_materials`
- etc.

**Option C: Full Schema (If Many Tables Missing)**

Run `mysql_schema.sql` - Creates all 20 tables (use with caution if tables already exist)

---

## 🔍 Step 3: Check for Table Name Mismatches

If AWS has tables with **different names**, check:

| App Expects | Possible AWS Name |
|-------------|-------------------|
| `inventory_items` | `products`, `items`, `inventory` |
| `internal_requests` | `requests`, `material_requests` |
| `purchase_orders` | `purchaseorders`, `pos` |
| `projects` | `project`, `condos` |
| `vendors` | `suppliers`, `vendor` |

**If you find mismatches:**
- Option 1: Rename table in AWS: `RENAME TABLE old_name TO new_name;`
- Option 2: Create view: `CREATE VIEW new_name AS SELECT * FROM old_name;`

---

## 📋 Complete Table List

### Tables Application Needs (20 total):

**Core (10 tables - may exist in AWS):**
1. `vendors`
2. `inventory_items` ⚠️ **MISSING - causing errors**
3. `product_vendors`
4. `internal_requests`
5. `request_items`
6. `purchase_orders`
7. `purchase_order_items`
8. `projects`
9. `audit_logs`
10. `user_profiles`

**New Live Claim System (10 tables - need to create):**
11. `project_templates`
12. `project_template_items`
13. `project_materials`
14. `claims`
15. `claim_items`
16. `returns`
17. `return_items`
18. `stock_adjustments`
19. `notifications` ⚠️ **MISSING - causing errors**
20. `user_projects`

---

## 🚀 Recommended Action Plan

1. **Run `CHECK_AWS_TABLES.sql`** to see what exists
2. **Run `CREATE_MISSING_TABLES.sql`** to create critical missing tables
3. **Run `NEW_TABLES_ONLY.sql`** to create all new Live Claim System tables
4. **Check for name mismatches** and fix them
5. **Restart backend server**
6. **Test application** - errors should be gone

---

## 📝 SQL Files Provided

1. **`CHECK_AWS_TABLES.sql`** - Check what tables exist
2. **`CREATE_MISSING_TABLES.sql`** - Create critical missing tables
3. **`NEW_TABLES_ONLY.sql`** - Create all 10 new tables
4. **`mysql_schema.sql`** - Complete schema (all 20 tables)

---

## ⚠️ Important Notes

- **Backup your AWS database** before running any CREATE TABLE scripts
- **Check existing tables first** to avoid conflicts
- **Foreign keys** may fail if referenced tables don't exist
- **Run `NEW_TABLES_ONLY.sql` first** - it handles foreign keys properly

---

## 🎯 Next Steps

1. Check existing tables: `SHOW TABLES;` in AWS
2. Create missing tables using provided SQL files
3. Share the list of existing tables with me if you need help identifying mismatches
4. Restart backend and test

Let me know what tables exist in your AWS database and I'll create a custom migration script!

