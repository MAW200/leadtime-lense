# Add Dummy Data to Application

## 🎯 Quick Start

After your backend server is running, populate the database with sample data:

```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
npm run seed
```

---

## 📊 What Gets Created

The seed script creates:

### ✅ **5 Vendors**
- ABC Suppliers Inc.
- Global Materials Co.
- Premium Hardware Ltd.
- Quick Ship Distributors
- Quality Build Supplies

### ✅ **20 Inventory Items**
- Lumber (2x4, various lengths)
- Drywall sheets
- Concrete mix
- Roofing materials
- Insulation
- PVC pipes
- Electrical supplies
- Paint
- Hardware (nails, screws)
- Doors and windows

### ✅ **5 Projects**
- Sunset Condos - Phase 1
- Ocean View Apartments
- Downtown Lofts
- Riverside Complex
- Harbor Heights

### ✅ **5 User Profiles**
- John Admin (CEO Admin)
- Sarah Warehouse (Warehouse Admin)
- Mike Onsite (Onsite Team)
- Lisa Manager (Warehouse Admin)
- Tom Builder (Onsite Team)

### ✅ **10 Internal Requests**
- Mix of pending, fulfilled, and cancelled requests
- With associated request items

### ✅ **8 Claims**
- Various statuses (pending, approved, rejected, fulfilled)
- With claim items

### ✅ **15 Notifications**
- Mix of read and unread notifications
- Various types (claim_created, request_fulfilled, stock_low, etc.)

### ✅ **20 Audit Logs**
- Various action types
- Associated with users and inventory items

### ✅ **Product-Vendor Relationships**
- Each product linked to 1-3 vendors
- Primary vendor assignments

### ✅ **User-Project Assignments**
- Users assigned to projects

---

## 🔧 Manual Seeding (If Script Fails)

If the seed script doesn't work, you can manually insert data:

### 1. Check Database Connection

```sql
-- In phpMyAdmin or MySQL command line
USE invmod;
SHOW TABLES;
```

### 2. Insert Vendors

```sql
INSERT INTO vendors (id, name, contact_email, contact_phone, lead_time_days, country, is_active, created_at, updated_at) 
VALUES 
(UUID(), 'ABC Suppliers Inc.', 'contact@abcsuppliers.com', '555-0100', 7, 'USA', TRUE, NOW(), NOW()),
(UUID(), 'Global Materials Co.', 'sales@globalmaterials.com', '555-0200', 14, 'USA', TRUE, NOW(), NOW());
```

### 3. Insert Inventory Items

```sql
INSERT INTO inventory_items 
(id, product_name, sku, in_stock, allocated, consumed_30d, on_order_local_14d, 
 on_order_shipment_a_60d, on_order_shipment_b_60d, signed_quotations, projected_stock, 
 safety_stock, unit_cost, created_at, updated_at) 
VALUES 
(UUID(), '2x4 Lumber - 8ft', 'LUM-2X4-8FT', 150, 10, 25, 20, 15, 10, 5, 140, 25, 8.50, NOW(), NOW()),
(UUID(), 'Drywall Sheet - 4x8', 'DW-4X8-STD', 45, 5, 10, 8, 12, 8, 3, 40, 10, 12.75, NOW(), NOW());
```

---

## 🐛 Troubleshooting

### Script Fails: "Cannot find module 'uuid'"

**Fix:** Install dependencies:
```powershell
cd server
npm install
```

### Script Fails: "Access denied for user"

**Fix:** Check `server/.env` file:
```env
DB_USER=root
DB_PASSWORD=  # Empty for XAMPP default
DB_NAME=invmod
```

### Script Fails: "Unknown database 'invmod'"

**Fix:** Create the database:
```sql
CREATE DATABASE invmod;
```

Then import schema:
```sql
-- Run mysql_schema.sql in phpMyAdmin
```

### Script Clears Existing Data

**Note:** The script clears all existing data before seeding. If you want to keep existing data, edit `server/scripts/seed-dummy-data.js` and comment out the "Clear existing data" section.

---

## ✅ Verify Data Was Created

After running the seed script, verify in phpMyAdmin:

```sql
-- Check counts
SELECT COUNT(*) as vendor_count FROM vendors;
SELECT COUNT(*) as inventory_count FROM inventory_items;
SELECT COUNT(*) as project_count FROM projects;
SELECT COUNT(*) as user_count FROM user_profiles;
SELECT COUNT(*) as request_count FROM internal_requests;
SELECT COUNT(*) as claim_count FROM claims;
SELECT COUNT(*) as notification_count FROM notifications;
```

Expected results:
- Vendors: 5
- Inventory Items: 20
- Projects: 5
- Users: 5
- Requests: 10
- Claims: 8
- Notifications: 15

---

## 🎯 Next Steps

After seeding:
1. **Refresh your frontend** - data should appear
2. **Test features** - create claims, requests, etc.
3. **Check notifications** - should see sample notifications
4. **View inventory** - should see 20 items

---

## 📝 Customizing Dummy Data

To customize the dummy data, edit `server/scripts/seed-dummy-data.js`:

- **Change vendor names/emails** - Edit the `vendors` array
- **Add more inventory items** - Add to `inventoryItems` array
- **Change project names** - Edit the `projects` array
- **Modify quantities** - Adjust the random number ranges

---

## 🔄 Re-seeding Data

To clear and re-seed:
```powershell
cd server
npm run seed
```

**Warning:** This will delete all existing data!

