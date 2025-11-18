# AWS Database Table Analysis & Migration Guide

## 🔍 Current Error Analysis

Your AWS database `renoxpert-staging-db` is missing tables. The application expects these tables but they don't exist.

---

## 📊 All Tables Required by Application

### **Core Inventory Tables** (Likely exist in AWS with same/different names)

1. `vendors` - Supplier/vendor information
2. `inventory_items` - Product inventory ⚠️ **ERROR: Missing**
3. `product_vendors` - Product-vendor relationships

### **Requests & Purchase Orders** (Likely exist in AWS)

4. `internal_requests` - Internal material requests
5. `request_items` - Request line items
6. `purchase_orders` - Purchase orders
7. `purchase_order_items` - PO line items

### **Projects & Audit** (May exist in AWS)

8. `projects` - Project/condo information
9. `audit_logs` - System audit trail
10. `user_profiles` - User information

### **Live Claim System Tables** (NEW - Need to create) ⚠️

11. `project_templates` - Reusable BOM templates ⚠️ **NEW**
12. `project_template_items` - Template items ⚠️ **NEW**
13. `project_materials` - Project BOM with claimed quantities ⚠️ **NEW**
14. `claims` - Material claims ⚠️ **NEW**
15. `claim_items` - Claim line items ⚠️ **NEW**
16. `returns` - Damaged goods returns ⚠️ **NEW**
17. `return_items` - Return line items ⚠️ **NEW**
18. `stock_adjustments` - Manual inventory adjustments ⚠️ **NEW**
19. `notifications` - System notifications ⚠️ **ERROR: Missing**
20. `user_projects` - User-project assignments ⚠️ **NEW**

---

## 🔍 Step 1: Check What Tables Exist in AWS

Run this SQL query in your AWS database to see existing tables:

```sql
SHOW TABLES;
```

Or get more details:

```sql
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'renoxpert-staging-db'
ORDER BY TABLE_NAME;
```

---

## 🔄 Step 2: Identify Table Name Mismatches

### Possible Name Variations

The application expects these exact names, but AWS might have:

| Application Expects    | Possible AWS Name                                     | Action                       |
| ---------------------- | ----------------------------------------------------- | ---------------------------- |
| `inventory_items`      | `products`, `items`, `inventory`, `product_inventory` | **Check & rename or create** |
| `internal_requests`    | `requests`, `material_requests`                       | **Check & rename or create** |
| `request_items`        | `request_line_items`, `request_products`              | **Check & rename or create** |
| `purchase_orders`      | `purchaseorders`, `pos`, `orders`                     | **Check & rename or create** |
| `purchase_order_items` | `po_items`, `order_items`, `purchaseorderitems`       | **Check & rename or create** |
| `projects`             | `project`, `condos`, `properties`                     | **Check & rename or create** |
| `vendors`              | `suppliers`, `vendor`                                 | **Check & rename or create** |
| `product_vendors`      | `product_suppliers`, `vendor_products`                | **Check & rename or create** |
| `user_profiles`        | `users`, `user`, `accounts`                           | **Check & rename or create** |
| `audit_logs`           | `audit`, `logs`, `audit_trail`                        | **Check & rename or create** |

---

## 🆕 Step 3: New Tables That Need to Be Created

These tables are **completely new** and need to be created in AWS:

### **Live Claim System Tables** (10 new tables)

1. ✅ `project_templates` - Reusable BOM templates
2. ✅ `project_template_items` - Template items
3. ✅ `project_materials` - Project BOM with claimed quantities
4. ✅ `claims` - Material claims
5. ✅ `claim_items` - Claim line items
6. ✅ `returns` - Damaged goods returns
7. ✅ `return_items` - Return line items
8. ✅ `stock_adjustments` - Manual inventory adjustments
9. ✅ `notifications` - System notifications ⚠️ **Currently causing errors**
10. ✅ `user_projects` - User-project assignments

**SQL File:** Use `NEW_TABLES_ONLY.sql` to create all new tables at once.

---

## 🛠️ Step 4: Migration Strategy

### Option A: Create Missing Tables Only (Recommended)

1. **Check existing tables** in AWS
2. **Create only missing tables** using `NEW_TABLES_ONLY.sql`
3. **Rename mismatched tables** (if needed) or create aliases

### Option B: Full Schema Import

1. **Backup AWS database** first!
2. **Import complete schema** using `mysql_schema.sql`
3. **This will create ALL tables** (may conflict with existing ones)

---

## 📝 Step 5: SQL Scripts to Run

### Check Existing Tables

```sql
-- List all tables
SHOW TABLES;

-- Check specific table exists
SELECT COUNT(*) as table_exists
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'renoxpert-staging-db'
AND TABLE_NAME = 'inventory_items';
```

### Create Missing Tables

**For NEW tables only:**

```sql
-- Run NEW_TABLES_ONLY.sql file
-- This creates the 10 new Live Claim System tables
```

**For ALL tables (if needed):**

```sql
-- Run mysql_schema.sql file
-- This creates all 20 tables
```

---

## 🔧 Step 6: Handle Table Name Mismatches

If AWS has tables with different names, you have two options:

### Option 1: Rename Tables in AWS (If safe)

```sql
-- Example: Rename 'products' to 'inventory_items'
RENAME TABLE products TO inventory_items;
```

### Option 2: Create Views (Safer - No data loss)

```sql
-- Example: Create view if AWS has 'products' but app expects 'inventory_items'
CREATE VIEW inventory_items AS SELECT * FROM products;
```

### Option 3: Update Application Code (Not recommended)

Change all references in code - this is more work and error-prone.

---

## 📋 Action Plan

### Immediate Actions:

1. **✅ Check existing tables in AWS:**

   ```sql
   SHOW TABLES;
   ```

2. **✅ Create NEW tables** (run `NEW_TABLES_ONLY.sql`):

   - This will create the 10 new Live Claim System tables
   - Includes `notifications` which is causing errors

3. **✅ Check for `inventory_items` table:**

   - If it exists with different name → Create view or rename
   - If it doesn't exist → Create it from schema

4. **✅ Verify all tables exist:**
   ```sql
   SELECT TABLE_NAME
   FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = 'renoxpert-staging-db'
   AND TABLE_NAME IN (
     'inventory_items', 'notifications', 'claims', 'returns',
     'project_templates', 'project_materials', 'stock_adjustments'
   );
   ```

---

## 🚨 Critical Missing Tables (Causing Errors)

Based on your errors, these tables are **definitely missing**:

1. ❌ `inventory_items` - **CRITICAL** - Application can't load inventory
2. ❌ `notifications` - **CRITICAL** - Application can't load notifications

**Fix:** Create these tables immediately using the schema files.

---

## 📄 Files to Use

1. **`NEW_TABLES_ONLY.sql`** - Creates only the 10 new tables (recommended first step)
2. **`mysql_schema.sql`** - Complete schema (all 20 tables) - use if many tables missing
3. **`EXPORT_IMPORT_QUERIES.sql`** - SQL queries to export/import data

---

## ✅ Verification Checklist

After creating tables:

- [ ] `inventory_items` exists
- [ ] `notifications` exists
- [ ] All 10 new Live Claim System tables exist
- [ ] Check for table name mismatches
- [ ] Test application - errors should be gone

---

## 🎯 Next Steps

1. **Run `SHOW TABLES;`** in AWS to see what exists
2. **Run `NEW_TABLES_ONLY.sql`** to create new tables
3. **Check if `inventory_items` exists** with different name
4. **Create missing tables** or rename existing ones
5. **Restart backend** and test

Let me know what tables exist in your AWS database and I'll help you create the exact migration script!
