/*
  # Add Missing Live Claim System Tables

  ## Summary
  Adds the missing tables for the Live Claim system without modifying existing tables.
  
  ## New Tables
  1. project_templates - Reusable BOM templates
  2. project_template_items - Template BOM items
  3. returns - Damaged goods returns
  4. return_items - Return line items
  5. stock_adjustments - Manual inventory adjustments
  
  ## Updates
  1. Add missing columns to existing tables
  2. Add database functions for generating numbers
*/

-- Add missing columns to claims table (non-destructive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claims' AND column_name = 'claim_type'
  ) THEN
    ALTER TABLE claims ADD COLUMN claim_type text DEFAULT 'standard' CHECK (claim_type IN ('standard', 'emergency'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claims' AND column_name = 'emergency_reason'
  ) THEN
    ALTER TABLE claims ADD COLUMN emergency_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claims' AND column_name = 'denial_reason'
  ) THEN
    ALTER TABLE claims ADD COLUMN denial_reason text;
  END IF;
END $$;

-- Update claim_items table for partial approvals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claim_items' AND column_name = 'quantity'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claim_items' AND column_name = 'quantity_requested'
  ) THEN
    ALTER TABLE claim_items RENAME COLUMN quantity TO quantity_requested;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claim_items' AND column_name = 'quantity_approved'
  ) THEN
    ALTER TABLE claim_items ADD COLUMN quantity_approved integer DEFAULT 0 CHECK (quantity_approved >= 0);
  END IF;
END $$;

-- Create project_templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_template_items table
CREATE TABLE IF NOT EXISTS project_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  phase text NOT NULL CHECK (phase IN ('P1', 'P2a', 'P2b')),
  required_quantity integer NOT NULL DEFAULT 0 CHECK (required_quantity >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  claim_id uuid REFERENCES claims(id) ON DELETE SET NULL,
  onsite_user_id text NOT NULL,
  onsite_user_name text NOT NULL,
  warehouse_admin_id text,
  warehouse_admin_name text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text NOT NULL,
  photo_url text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create return_items table
CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

-- Create stock_adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number text UNIQUE NOT NULL,
  product_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_change integer NOT NULL CHECK (quantity_change != 0),
  reason text NOT NULL,
  notes text,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  admin_id text NOT NULL,
  admin_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Update notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'recipient_role'
  ) THEN
    ALTER TABLE notifications ADD COLUMN recipient_role text DEFAULT 'ceo_admin' 
      CHECK (recipient_role IN ('ceo_admin', 'warehouse_admin', 'onsite_team'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN notification_type text DEFAULT 'general';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'related_return_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN related_return_id uuid REFERENCES returns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_template_items_template_id ON project_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_project_template_items_product_id ON project_template_items(product_id);
CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_returns_project_id ON returns(project_id);
CREATE INDEX IF NOT EXISTS idx_returns_claim_id ON returns(claim_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_templates
CREATE POLICY "Allow public read access to project_templates"
  ON project_templates FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on project_templates"
  ON project_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on project_templates"
  ON project_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on project_templates"
  ON project_templates FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for project_template_items
CREATE POLICY "Allow public read access to project_template_items"
  ON project_template_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on project_template_items"
  ON project_template_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on project_template_items"
  ON project_template_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on project_template_items"
  ON project_template_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for returns
CREATE POLICY "Allow public read access to returns"
  ON returns FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on returns"
  ON returns FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for return_items
CREATE POLICY "Allow public read access to return_items"
  ON return_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on return_items"
  ON return_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on return_items"
  ON return_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on return_items"
  ON return_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for stock_adjustments
CREATE POLICY "Allow public read access to stock_adjustments"
  ON stock_adjustments FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on stock_adjustments"
  ON stock_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on stock_adjustments"
  ON stock_adjustments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on stock_adjustments"
  ON stock_adjustments FOR DELETE
  TO authenticated
  USING (true);

-- Create function to generate unique claim numbers
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS text AS $$
DECLARE
  new_number text;
  max_number integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM 10) AS integer)), 0)
  INTO max_number
  FROM claims
  WHERE claim_number LIKE 'CLM-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';

  new_number := 'CLM-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD((max_number + 1)::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique return numbers
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS text AS $$
DECLARE
  new_number text;
  max_number integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 10) AS integer)), 0)
  INTO max_number
  FROM returns
  WHERE return_number LIKE 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';

  new_number := 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD((max_number + 1)::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique adjustment numbers
CREATE OR REPLACE FUNCTION generate_adjustment_number()
RETURNS text AS $$
DECLARE
  new_number text;
  max_number integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(adjustment_number FROM 10) AS integer)), 0)
  INTO max_number
  FROM stock_adjustments
  WHERE adjustment_number LIKE 'ADJ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';

  new_number := 'ADJ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD((max_number + 1)::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_project_templates_updated_at ON project_templates;
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON project_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
