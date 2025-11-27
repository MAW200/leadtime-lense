-- Add performance indexes for commonly queried columns
-- This migration improves query performance across the application

-- Inventory and Products
CREATE INDEX IF NOT EXISTS idx_inventory_master_product 
  ON inventory_items(master_product_id) 
  WHERE master_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_sku 
  ON inventory_items(sku);

CREATE INDEX IF NOT EXISTS idx_product_vendors_product 
  ON product_vendors(product_id);

CREATE INDEX IF NOT EXISTS idx_product_vendors_vendor 
  ON product_vendors(vendor_id);

-- Projects and User Assignments
CREATE INDEX IF NOT EXISTS idx_user_projects_user 
  ON user_projects(user_id);

CREATE INDEX IF NOT EXISTS idx_user_projects_project 
  ON user_projects(project_id);

CREATE INDEX IF NOT EXISTS idx_projects_status 
  ON projects(status);

-- Requests and Items


CREATE INDEX IF NOT EXISTS idx_requests_status 
  ON internal_requests(status);

CREATE INDEX IF NOT EXISTS idx_requests_project 
  ON internal_requests(project_id) 
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_request_items_request 
  ON request_items(request_id);

-- Claims and Returns
CREATE INDEX IF NOT EXISTS idx_claims_status 
  ON material_claims(status);

CREATE INDEX IF NOT EXISTS idx_claims_project 
  ON material_claims(project_id);

CREATE INDEX IF NOT EXISTS idx_claim_items_claim 
  ON claim_items(claim_id);

CREATE INDEX IF NOT EXISTS idx_returns_status 
  ON returns(status);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_po_status 
  ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_po_vendor 
  ON purchase_orders(vendor_id);

CREATE INDEX IF NOT EXISTS idx_po_items_po 
  ON purchase_order_items(po_id);

-- Audit and Notifications
CREATE INDEX IF NOT EXISTS idx_audit_timestamp 
  ON audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_action 
  ON audit_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role 
  ON notifications(recipient_role, is_read) 
  WHERE recipient_role IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user 
  ON notifications(recipient_user_id, is_read) 
  WHERE recipient_user_id IS NOT NULL;
