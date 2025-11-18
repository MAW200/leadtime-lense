# MySQL Database Data Requirements

## Overview
This document outlines exactly what data you need to populate in your MySQL database for the Leadtime Lense application to work properly.

---

## 📊 Table Categories

### ✅ **EXISTING TABLES** (Pull from your AWS main database)
These tables likely already exist in your main application database:

1. **vendors** - Supplier/vendor information
2. **inventory_items** - Product inventory
3. **product_vendors** - Product-vendor relationships
4. **internal_requests** - Internal material requests
5. **request_items** - Request line items
6. **purchase_orders** - Purchase orders
7. **purchase_order_items** - PO line items
8. **projects** - Project/condo information
9. **audit_logs** - System audit trail
10. **user_profiles** - User information

### 🆕 **NEW TABLES** (Need to be added to AWS main database)
These are new tables from the Live Claim system that need to be created:

1. **project_templates** - Reusable BOM templates
2. **project_template_items** - Template items
3. **project_materials** - Project BOM with claimed quantities
4. **claims** - Material claims
5. **claim_items** - Claim line items
6. **returns** - Damaged goods returns
7. **return_items** - Return line items
8. **stock_adjustments** - Manual inventory adjustments
9. **notifications** - System notifications
10. **user_projects** - User-project assignments

---

## 📋 Detailed Data Requirements

### 1. **vendors** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `name` (TEXT) - Vendor/supplier name
- `contact_email` (TEXT) - Optional
- `contact_phone` (TEXT) - Optional
- `lead_time_days` (INT) - Default: 14
- `country` (TEXT) - Default: 'USA'
- `is_active` (BOOLEAN) - Default: TRUE

**Sample Data:**
```sql
INSERT INTO vendors (id, name, contact_email, contact_phone, lead_time_days, country, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'ABC Suppliers', 'contact@abcsuppliers.com', '555-0100', 14, 'USA', TRUE),
('550e8400-e29b-41d4-a716-446655440001', 'XYZ Manufacturing', 'sales@xyz.com', '555-0101', 21, 'China', TRUE);
```

---

### 2. **inventory_items** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `product_name` (TEXT) - Product name
- `sku` (VARCHAR(255)) - **UNIQUE** SKU code
- `in_stock` (INT) - Current stock level
- `allocated` (INT) - Allocated quantity
- `consumed_30d` (INT) - Consumption in last 30 days
- `on_order_local_14d` (INT) - Orders expected in 14 days
- `on_order_shipment_a_60d` (INT) - Shipment A expected in 60 days
- `on_order_shipment_b_60d` (INT) - Shipment B expected in 60 days
- `signed_quotations` (INT) - Signed quotations
- `projected_stock` (INT) - Projected stock level
- `safety_stock` (INT) - Safety stock threshold (Default: 25)
- `unit_cost` (DECIMAL(10,2)) - Unit cost (Default: 125.00)

**Sample Data:**
```sql
INSERT INTO inventory_items (id, product_name, sku, in_stock, allocated, safety_stock, unit_cost) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Concrete Mix 50kg', 'CONC-50KG-001', 150, 20, 25, 45.50),
('660e8400-e29b-41d4-a716-446655440001', 'Steel Rebar 12mm', 'STEEL-12MM-001', 500, 100, 50, 12.75);
```

---

### 3. **product_vendors** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `product_id` (CHAR(36)) - FK to inventory_items
- `vendor_id` (CHAR(36)) - FK to vendors
- `is_primary` (BOOLEAN) - Is this the primary vendor?
- `vendor_sku` (TEXT) - Vendor's SKU for this product
- `unit_price` (DECIMAL(10,2)) - Price from this vendor
- `minimum_order_qty` (INT) - Minimum order quantity
- `lead_time_days` (INT) - Lead time from this vendor

**Sample Data:**
```sql
INSERT INTO product_vendors (id, product_id, vendor_id, is_primary, vendor_sku, unit_price, minimum_order_qty, lead_time_days) VALUES
('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', TRUE, 'ABC-CONC-50', 45.00, 10, 14);
```

---

### 4. **projects** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `name` (TEXT) - Project name (e.g., "Condo Building A")
- `location` (TEXT) - Project location
- `status` (ENUM) - 'active', 'completed', 'on_hold'
- `description` (TEXT) - Optional description

**Sample Data:**
```sql
INSERT INTO projects (id, name, location, status, description) VALUES
('880e8400-e29b-41d4-a716-446655440000', 'Condo Building A', '123 Main St, City', 'active', 'New construction project'),
('880e8400-e29b-41d4-a716-446655440001', 'Condo Building B', '456 Oak Ave, City', 'active', NULL);
```

---

### 5. **user_profiles** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `name` (TEXT) - User's full name
- `email` (VARCHAR(255)) - **UNIQUE** email address
- `role` (ENUM) - 'ceo_admin', 'warehouse_admin', 'onsite_team'
- `is_active` (BOOLEAN) - Account active status

**Sample Data:**
```sql
INSERT INTO user_profiles (id, name, email, role, is_active) VALUES
('990e8400-e29b-41d4-a716-446655440000', 'John Admin', 'john@company.com', 'ceo_admin', TRUE),
('990e8400-e29b-41d4-a716-446655440001', 'Jane Warehouse', 'jane@company.com', 'warehouse_admin', TRUE),
('990e8400-e29b-41d4-a716-446655440002', 'Bob Onsite', 'bob@company.com', 'onsite_team', TRUE);
```

---

### 6. **internal_requests** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `request_number` (VARCHAR(255)) - **UNIQUE** request number (e.g., "REQ-2024-0001")
- `requester_name` (TEXT) - Name of requester
- `requester_email` (TEXT) - Optional
- `destination_property` (TEXT) - Where items are going
- `status` (ENUM) - 'pending', 'fulfilled', 'cancelled'
- `notes` (TEXT) - Optional notes
- `project_id` (CHAR(36)) - FK to projects (optional)
- `photo_url` (TEXT) - Optional photo URL
- `created_by_role` (TEXT) - Role of creator

---

### 7. **request_items** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `request_id` (CHAR(36)) - FK to internal_requests
- `product_id` (CHAR(36)) - FK to inventory_items
- `quantity_requested` (INT) - Quantity requested
- `quantity_fulfilled` (INT) - Quantity fulfilled

---

### 8. **purchase_orders** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `po_number` (VARCHAR(255)) - **UNIQUE** PO number
- `vendor_id` (CHAR(36)) - FK to vendors
- `status` (ENUM) - 'draft', 'sent', 'in_transit', 'received', 'cancelled'
- `total_amount` (DECIMAL(10,2)) - Total order amount
- `order_date` (DATETIME) - Order date
- `expected_delivery_date` (DATETIME) - Expected delivery
- `actual_delivery_date` (DATETIME) - Actual delivery
- `good_quality_qty` (INT) - Good quality received
- `bad_quality_qty` (INT) - Bad quality received
- `qa_photo_url` (TEXT) - QA inspection photo
- `qa_completed_at` (DATETIME) - QA completion time
- `qa_completed_by` (TEXT) - QA inspector name

---

### 9. **purchase_order_items** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `po_id` (CHAR(36)) - FK to purchase_orders
- `product_id` (CHAR(36)) - FK to inventory_items
- `quantity` (INT) - Quantity ordered
- `unit_price` (DECIMAL(10,2)) - Unit price
- `subtotal` (DECIMAL(10,2)) - Line total

---

### 10. **audit_logs** (EXISTING - Pull from AWS)
**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `timestamp` (DATETIME) - Action timestamp
- `user_name` (TEXT) - User who performed action
- `user_role` (ENUM) - 'ceo_admin', 'warehouse_admin', 'onsite_team', 'system'
- `action_type` (TEXT) - Type of action
- `action_description` (TEXT) - Description of action
- `related_entity_type` (TEXT) - Related entity type
- `related_entity_id` (CHAR(36)) - Related entity ID
- `photo_url` (TEXT) - Optional photo
- `metadata` (JSON) - Optional metadata

---

## 🆕 NEW TABLES (Need to Create in AWS)

### 11. **project_templates** (NEW)
**Purpose:** Reusable Bill of Materials templates for projects

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `name` (TEXT) - Template name (e.g., "Standard 2BR Condo")
- `description` (TEXT) - Optional description
- `is_active` (BOOLEAN) - Template active status

**Sample Data:**
```sql
INSERT INTO project_templates (id, name, description, is_active) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', 'Standard 2BR Condo', 'Standard materials for 2 bedroom condo', TRUE),
('aa0e8400-e29b-41d4-a716-446655440001', 'Standard 3BR Condo', 'Standard materials for 3 bedroom condo', TRUE);
```

---

### 12. **project_template_items** (NEW)
**Purpose:** Items in each template (BOM items)

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `template_id` (CHAR(36)) - FK to project_templates
- `product_id` (CHAR(36)) - FK to inventory_items
- `phase` (ENUM) - 'P1', 'P2a', 'P2b'
- `required_quantity` (INT) - Required quantity for this phase

**Sample Data:**
```sql
INSERT INTO project_template_items (id, template_id, product_id, phase, required_quantity) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', 'aa0e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'P1', 50),
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'P1', 200);
```

---

### 13. **project_materials** (NEW)
**Purpose:** Bill of Materials for specific projects with claimed quantities

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `project_id` (CHAR(36)) - FK to projects
- `product_id` (CHAR(36)) - FK to inventory_items
- `phase` (ENUM) - 'P1', 'P2a', 'P2b'
- `required_quantity` (INT) - Required quantity
- `claimed_quantity` (INT) - Already claimed quantity (starts at 0)

**Sample Data:**
```sql
INSERT INTO project_materials (id, project_id, product_id, phase, required_quantity, claimed_quantity) VALUES
('cc0e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'P1', 50, 0),
('cc0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'P1', 200, 0);
```

---

### 14. **claims** (NEW)
**Purpose:** Material claims from onsite team

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `claim_number` (VARCHAR(255)) - **UNIQUE** claim number (auto-generated)
- `project_id` (CHAR(36)) - FK to projects
- `onsite_user_id` (CHAR(36)) - FK to user_profiles
- `onsite_user_name` (TEXT) - Onsite user name
- `warehouse_admin_id` (CHAR(36)) - FK to user_profiles (nullable)
- `warehouse_admin_name` (TEXT) - Warehouse admin name (nullable)
- `status` (ENUM) - 'pending', 'approved', 'partial_approved', 'denied'
- `claim_type` (ENUM) - 'standard', 'emergency'
- `photo_url` (TEXT) - Photo of claim
- `emergency_reason` (TEXT) - Reason if emergency claim
- `denial_reason` (TEXT) - Reason if denied
- `notes` (TEXT) - Optional notes
- `processed_at` (DATETIME) - When processed (nullable)

**Note:** This table starts empty - claims are created through the application.

---

### 15. **claim_items** (NEW)
**Purpose:** Items in each claim

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `claim_id` (CHAR(36)) - FK to claims
- `product_id` (CHAR(36)) - FK to inventory_items
- `quantity_requested` (INT) - Quantity requested
- `quantity_approved` (INT) - Quantity approved (starts at 0)

**Note:** This table starts empty - items are created when claims are submitted.

---

### 16. **returns** (NEW)
**Purpose:** Damaged goods returns

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `return_number` (VARCHAR(255)) - **UNIQUE** return number (auto-generated)
- `project_id` (CHAR(36)) - FK to projects
- `claim_id` (CHAR(36)) - FK to claims (nullable)
- `onsite_user_id` (CHAR(36)) - FK to user_profiles
- `onsite_user_name` (TEXT) - Onsite user name
- `warehouse_admin_id` (CHAR(36)) - FK to user_profiles (nullable)
- `warehouse_admin_name` (TEXT) - Warehouse admin name (nullable)
- `status` (ENUM) - 'pending', 'approved', 'rejected'
- `reason` (TEXT) - Return reason
- `photo_url` (TEXT) - Photo of damaged goods
- `notes` (TEXT) - Optional notes
- `processed_at` (DATETIME) - When processed (nullable)

**Note:** This table starts empty - returns are created through the application.

---

### 17. **return_items** (NEW)
**Purpose:** Items being returned

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `return_id` (CHAR(36)) - FK to returns
- `product_id` (CHAR(36)) - FK to inventory_items
- `quantity` (INT) - Quantity being returned

**Note:** This table starts empty - items are created when returns are submitted.

---

### 18. **stock_adjustments** (NEW)
**Purpose:** Manual inventory adjustments

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `adjustment_number` (VARCHAR(255)) - **UNIQUE** adjustment number (auto-generated)
- `product_id` (CHAR(36)) - FK to inventory_items
- `quantity_change` (INT) - Positive for additions, negative for subtractions
- `reason` (TEXT) - Reason for adjustment
- `notes` (TEXT) - Optional notes
- `previous_stock` (INT) - Stock before adjustment
- `new_stock` (INT) - Stock after adjustment
- `admin_id` (CHAR(36)) - FK to user_profiles
- `admin_name` (TEXT) - Admin name

**Note:** This table starts empty - adjustments are created through the application.

---

### 19. **notifications** (NEW)
**Purpose:** System notifications for users

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `recipient_user_id` (CHAR(36)) - User ID or role name
- `recipient_role` (ENUM) - 'ceo_admin', 'warehouse_admin', 'onsite_team'
- `message` (TEXT) - Notification message
- `notification_type` (TEXT) - Type of notification
- `related_claim_id` (CHAR(36)) - FK to claims (nullable)
- `related_return_id` (CHAR(36)) - FK to returns (nullable)
- `is_read` (BOOLEAN) - Read status (default: FALSE)

**Note:** This table starts empty - notifications are created automatically by the system.

---

### 20. **user_projects** (NEW)
**Purpose:** Assign onsite team members to projects

**Required Fields:**
- `id` (CHAR(36)) - UUID format
- `user_id` (CHAR(36)) - FK to user_profiles
- `project_id` (CHAR(36)) - FK to projects

**Sample Data:**
```sql
INSERT INTO user_projects (id, user_id, project_id) VALUES
('ee0e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440000');
```

---

## 📝 Data Migration Checklist

### Step 1: Pull Existing Data from AWS
- [ ] Export `vendors` table
- [ ] Export `inventory_items` table
- [ ] Export `product_vendors` table
- [ ] Export `projects` table
- [ ] Export `user_profiles` table
- [ ] Export `internal_requests` table
- [ ] Export `request_items` table
- [ ] Export `purchase_orders` table
- [ ] Export `purchase_order_items` table
- [ ] Export `audit_logs` table (if you want historical data)

### Step 2: Create New Tables in AWS
- [ ] Run `mysql_schema.sql` on AWS database (or just the NEW table definitions)
- [ ] Verify all new tables are created
- [ ] Test auto-generated functions (generate_claim_number, etc.)

### Step 3: Populate Initial Data
- [ ] Import existing data from Step 1
- [ ] Create at least 1 project_template (for testing)
- [ ] Create project_template_items for the template
- [ ] Create project_materials for at least 1 project
- [ ] Create user_projects assignments

### Step 4: Verify Data
- [ ] Check all foreign keys are valid
- [ ] Verify UUIDs are in correct format (CHAR(36))
- [ ] Test application can read all data
- [ ] Test creating a claim works
- [ ] Test creating a return works

---

## 🔑 Critical Requirements

### UUID Format
- **MUST** be CHAR(36) format: `550e8400-e29b-41d4-a716-446655440000`
- Generate UUIDs in your application code (Node.js: `uuid` package)

### Foreign Keys
- All foreign keys MUST reference existing records
- Check `inventory_items` exist before creating `product_vendors`
- Check `projects` exist before creating `project_materials`
- Check `user_profiles` exist before creating `claims` or `returns`

### Required Minimum Data
To make the application functional, you need at minimum:
1. **At least 1 vendor** (for purchase orders)
2. **At least 5-10 inventory items** (for claims/requests)
3. **At least 1 project** (for claims/returns)
4. **At least 3 users** (1 of each role: ceo_admin, warehouse_admin, onsite_team)
5. **At least 1 project_template** (for creating projects from templates)
6. **At least 1 project_materials entry** (BOM for a project)

---

## 📊 Sample SQL Export Queries

### Export from AWS Main Database

```sql
-- Export vendors
SELECT * FROM vendors;

-- Export inventory_items
SELECT * FROM inventory_items;

-- Export product_vendors
SELECT * FROM product_vendors;

-- Export projects
SELECT * FROM projects;

-- Export user_profiles
SELECT * FROM user_profiles;

-- Export internal_requests
SELECT * FROM internal_requests;

-- Export request_items
SELECT * FROM request_items;

-- Export purchase_orders
SELECT * FROM purchase_orders;

-- Export purchase_order_items
SELECT * FROM purchase_order_items;

-- Export audit_logs (optional - historical data)
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000;
```

---

## 🚀 Next Steps

1. **Review this document** - Understand what data you need
2. **Export from AWS** - Pull existing data using queries above
3. **Create new tables** - Run `mysql_schema.sql` on AWS database
4. **Import data** - Import exported data into AWS database
5. **Create initial templates** - Set up at least 1 project template
6. **Test application** - Verify everything works

---

## ❓ Questions?

If you need clarification on any table or field, refer to `mysql_schema.sql` for the complete table definitions with all constraints and indexes.

