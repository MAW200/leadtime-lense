-- ============================================================================
-- PostgreSQL Schema for Leadtime Lense Inventory Management System
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE INVENTORY TABLES
-- ============================================================================

-- vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  lead_time_days INT DEFAULT 14,
  country TEXT DEFAULT 'USA',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);

-- inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  unit_cost DECIMAL(10,2) DEFAULT 125.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);

-- product_vendors junction table
CREATE TABLE IF NOT EXISTS product_vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  vendor_sku TEXT,
  unit_price DECIMAL(10,2) DEFAULT 0,
  minimum_order_qty INT DEFAULT 1,
  lead_time_days INT DEFAULT 14,
  last_order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_product_vendors_product_id ON product_vendors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_vendors_vendor_id ON product_vendors(vendor_id);

-- ============================================================================
-- PROJECTS AND AUDIT SYSTEM
-- ============================================================================

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'on_hold')) DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- requests and purchase orders need projects so we define projects first

-- internal_requests table
CREATE TABLE IF NOT EXISTS internal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(255) UNIQUE NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT,
  destination_property TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'fulfilled', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  fulfilled_date TIMESTAMPTZ,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  photo_url TEXT,
  created_by_role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_requests_status ON internal_requests(status);
CREATE INDEX IF NOT EXISTS idx_internal_requests_created_at ON internal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_requests_project_id ON internal_requests(project_id);

-- request_items junction table
CREATE TABLE IF NOT EXISTS request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES internal_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_requested INT NOT NULL DEFAULT 1,
  quantity_fulfilled INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_product_id ON request_items(product_id);

-- purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number VARCHAR(255) UNIQUE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  status TEXT CHECK (status IN ('draft', 'sent', 'in_transit', 'received', 'cancelled')) DEFAULT 'draft',
  total_amount DECIMAL(12,2) DEFAULT 0,
  order_date TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_by TEXT,
  good_quality_qty INT DEFAULT 0,
  bad_quality_qty INT DEFAULT 0,
  qa_photo_url TEXT,
  qa_completed_at TIMESTAMPTZ,
  qa_completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date DESC);

-- purchase_order_items junction table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(po_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product_id ON purchase_order_items(product_id);

-- audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT NOT NULL,
  user_role TEXT CHECK (user_role IN ('ceo_admin', 'warehouse_admin', 'onsite_team', 'system')),
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  photo_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_name ON audit_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email VARCHAR(255) UNIQUE,
  role TEXT CHECK (role IN ('ceo_admin', 'warehouse_admin', 'onsite_team')) DEFAULT 'onsite_team',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ============================================================================
-- LIVE CLAIM SYSTEM TABLES
-- ============================================================================

-- project_templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- project_template_items table
CREATE TABLE IF NOT EXISTS project_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  phase TEXT CHECK (phase IN ('P1', 'P2a', 'P2b')) NOT NULL,
  required_quantity INT NOT NULL DEFAULT 0 CHECK (required_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_template_items_template_id ON project_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_project_template_items_product_id ON project_template_items(product_id);

-- project_materials table
CREATE TABLE IF NOT EXISTS project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  phase TEXT CHECK (phase IN ('P1', 'P2a', 'P2b')) NOT NULL,
  required_quantity INT NOT NULL DEFAULT 0 CHECK (required_quantity >= 0),
  claimed_quantity INT NOT NULL DEFAULT 0 CHECK (claimed_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, product_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_product_id ON project_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_phase ON project_materials(phase);

-- claims table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number VARCHAR(255) UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  onsite_user_id TEXT NOT NULL,
  onsite_user_name TEXT NOT NULL,
  warehouse_admin_id TEXT,
  warehouse_admin_name TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'partial_approved', 'denied')) DEFAULT 'pending',
  claim_type TEXT CHECK (claim_type IN ('standard', 'emergency')) DEFAULT 'standard',
  photo_url TEXT NOT NULL,
  emergency_reason TEXT,
  denial_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claims_project_id ON claims(project_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- claim_items table
CREATE TABLE IF NOT EXISTS claim_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_requested INT NOT NULL CHECK (quantity_requested > 0),
  quantity_approved INT DEFAULT 0 CHECK (quantity_approved >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_items_claim_id ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_product_id ON claim_items(product_id);

-- returns table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number VARCHAR(255) UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
  onsite_user_id TEXT NOT NULL,
  onsite_user_name TEXT NOT NULL,
  warehouse_admin_id TEXT,
  warehouse_admin_name TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reason TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_returns_project_id ON returns(project_id);
CREATE INDEX IF NOT EXISTS idx_returns_claim_id ON returns(claim_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

-- return_items table
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);

-- stock_adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adjustment_number VARCHAR(255) UNIQUE NOT NULL,
  product_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_change INT NOT NULL CHECK (quantity_change != 0),
  reason TEXT NOT NULL,
  notes TEXT,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id TEXT NOT NULL,
  recipient_role TEXT CHECK (recipient_role IN ('ceo_admin', 'warehouse_admin', 'onsite_team')) NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  related_claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  related_return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- user_projects table
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects(project_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update_updated_at_column trigger to all tables with updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_vendors_updated_at BEFORE UPDATE ON product_vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_internal_requests_updated_at BEFORE UPDATE ON internal_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_materials_updated_at BEFORE UPDATE ON project_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique claim numbers (CLM-YYYY-####)
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  max_number INT;
  current_year TEXT;
BEGIN
  current_year := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM 10) AS INTEGER)), 0)
  INTO max_number
  FROM claims
  WHERE claim_number LIKE 'CLM-' || current_year || '-%';
  
  new_number := 'CLM-' || current_year || '-' || LPAD((max_number + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique return numbers (RET-YYYY-####)
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  max_number INT;
  current_year TEXT;
BEGIN
  current_year := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 10) AS INTEGER)), 0)
  INTO max_number
  FROM returns
  WHERE return_number LIKE 'RET-' || current_year || '-%';
  
  new_number := 'RET-' || current_year || '-' || LPAD((max_number + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique adjustment numbers (ADJ-YYYY-####)
CREATE OR REPLACE FUNCTION generate_adjustment_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  max_number INT;
  current_year TEXT;
BEGIN
  current_year := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(adjustment_number FROM 10) AS INTEGER)), 0)
  INTO max_number
  FROM stock_adjustments
  WHERE adjustment_number LIKE 'ADJ-' || current_year || '-%';
  
  new_number := 'ADJ-' || current_year || '-' || LPAD((max_number + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate request numbers (REQ-####)
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  max_number INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 5) AS INTEGER)), 0) + 1
  INTO max_number
  FROM internal_requests;
  
  new_number := 'REQ-' || LPAD(max_number::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate PO numbers (PO-####)
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  max_number INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 1000) + 1
  INTO max_number
  FROM purchase_orders;
  
  new_number := 'PO-' || max_number::TEXT;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
