/*
  # Create Live Claim System Tables

  ## Summary
  This migration creates the complete database schema for the Live Claim system,
  including Project Templates, Claims with partial approval support, Returns for
  damaged goods, Stock Adjustments, and Notifications system.

  ## New Tables

  ### 1. project_templates
  Reusable Bill of Materials templates for standardizing project setup
  - `id` (uuid, primary key) - Unique template identifier
  - `name` (text) - Template name (e.g., "Parkside Condo")
  - `description` (text) - Template description
  - `is_active` (boolean) - Whether template is active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ### 2. project_template_items
  Products in each template's Bill of Materials organized by phase
  - `id` (uuid, primary key) - Unique item identifier
  - `template_id` (uuid) - Foreign key to project_templates
  - `product_id` (uuid) - Foreign key to inventory_items
  - `phase` (text) - Project phase: P1, P2a, P2b
  - `required_quantity` (integer) - Required quantity for this phase
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. project_materials
  Actual Bill of Materials for a specific project with tracking of claimed quantities
  - `id` (uuid, primary key) - Unique material identifier
  - `project_id` (uuid) - Foreign key to projects
  - `product_id` (uuid) - Foreign key to inventory_items
  - `phase` (text) - Project phase: P1, P2a, P2b
  - `required_quantity` (integer) - Total required quantity
  - `claimed_quantity` (integer) - Quantity already claimed
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ### 4. claims
  Material claims submitted by onsite team members
  - `id` (uuid, primary key) - Unique claim identifier
  - `claim_number` (text, unique) - Human-readable claim number (CLM-2024-0001)
  - `project_id` (uuid) - Foreign key to projects
  - `onsite_user_id` (text) - ID of onsite team member
  - `onsite_user_name` (text) - Name of onsite team member
  - `warehouse_admin_id` (text) - ID of warehouse admin who processed
  - `warehouse_admin_name` (text) - Name of warehouse admin who processed
  - `status` (text) - Status: pending, approved, partial_approved, denied
  - `claim_type` (text) - Type: standard, emergency
  - `photo_url` (text) - URL to audit photo (mandatory)
  - `emergency_reason` (text) - Reason for emergency claim
  - `denial_reason` (text) - Reason for denial
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp
  - `processed_at` (timestamptz) - When claim was processed

  ### 5. claim_items
  Individual products in each claim with requested and approved quantities
  - `id` (uuid, primary key) - Unique item identifier
  - `claim_id` (uuid) - Foreign key to claims
  - `product_id` (uuid) - Foreign key to inventory_items
  - `quantity_requested` (integer) - Quantity requested by onsite team
  - `quantity_approved` (integer) - Quantity approved by warehouse (can be partial)
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. returns
  Damaged goods returns from onsite to warehouse
  - `id` (uuid, primary key) - Unique return identifier
  - `return_number` (text, unique) - Human-readable return number (RET-2024-0001)
  - `project_id` (uuid) - Foreign key to projects
  - `claim_id` (uuid) - Foreign key to original claim (optional)
  - `onsite_user_id` (text) - ID of onsite team member
  - `onsite_user_name` (text) - Name of onsite team member
  - `warehouse_admin_id` (text) - ID of warehouse admin who processed
  - `warehouse_admin_name` (text) - Name of warehouse admin who processed
  - `status` (text) - Status: pending, approved, rejected
  - `reason` (text) - Return reason (damaged, defective, etc.)
  - `photo_url` (text) - URL to damage photo (mandatory)
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp
  - `processed_at` (timestamptz) - When return was processed

  ### 7. return_items
  Individual products being returned
  - `id` (uuid, primary key) - Unique item identifier
  - `return_id` (uuid) - Foreign key to returns
  - `product_id` (uuid) - Foreign key to inventory_items
  - `quantity` (integer) - Quantity being returned
  - `created_at` (timestamptz) - Creation timestamp

  ### 8. stock_adjustments
  Manual inventory adjustments by warehouse admin
  - `id` (uuid, primary key) - Unique adjustment identifier
  - `adjustment_number` (text, unique) - Human-readable number (ADJ-2024-0001)
  - `product_id` (uuid) - Foreign key to inventory_items
  - `quantity_change` (integer) - Change in quantity (positive or negative)
  - `reason` (text) - Adjustment reason
  - `notes` (text) - Additional notes
  - `previous_stock` (integer) - Stock level before adjustment
  - `new_stock` (integer) - Stock level after adjustment
  - `admin_id` (text) - ID of admin who made adjustment
  - `admin_name` (text) - Name of admin who made adjustment
  - `created_at` (timestamptz) - Creation timestamp

  ### 9. notifications
  System notifications for users
  - `id` (uuid, primary key) - Unique notification identifier
  - `recipient_user_id` (text) - ID of user receiving notification
  - `recipient_role` (text) - Role of recipient
  - `message` (text) - Notification message
  - `notification_type` (text) - Type: claim_approved, claim_denied, emergency_claim, etc.
  - `related_claim_id` (uuid) - Related claim ID (optional)
  - `related_return_id` (uuid) - Related return ID (optional)
  - `is_read` (boolean) - Whether notification has been read
  - `created_at` (timestamptz) - Creation timestamp

  ### 10. user_projects
  Assignment of onsite team members to projects
  - `id` (uuid, primary key) - Unique assignment identifier
  - `user_id` (text) - ID of onsite team member
  - `project_id` (uuid) - Foreign key to projects
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Public read access for most tables (authenticated operations)
  - Proper policies for insert, update, delete operations

  ## Indexes
  Performance indexes on all foreign keys, status fields, and frequently queried columns
*/

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

-- Create project_materials table
CREATE TABLE IF NOT EXISTS project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  phase text NOT NULL CHECK (phase IN ('P1', 'P2a', 'P2b')),
  required_quantity integer NOT NULL DEFAULT 0 CHECK (required_quantity >= 0),
  claimed_quantity integer NOT NULL DEFAULT 0 CHECK (claimed_quantity >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, product_id, phase)
);

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number text UNIQUE NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  onsite_user_id text NOT NULL,
  onsite_user_name text NOT NULL,
  warehouse_admin_id text,
  warehouse_admin_name text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'partial_approved', 'denied')),
  claim_type text DEFAULT 'standard' CHECK (claim_type IN ('standard', 'emergency')),
  photo_url text NOT NULL,
  emergency_reason text,
  denial_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create claim_items table
CREATE TABLE IF NOT EXISTS claim_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_requested integer NOT NULL CHECK (quantity_requested > 0),
  quantity_approved integer DEFAULT 0 CHECK (quantity_approved >= 0),
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id text NOT NULL,
  recipient_role text NOT NULL CHECK (recipient_role IN ('ceo_admin', 'warehouse_admin', 'onsite_team')),
  message text NOT NULL,
  notification_type text NOT NULL,
  related_claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  related_return_id uuid REFERENCES returns(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_projects table
CREATE TABLE IF NOT EXISTS user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_template_items_template_id ON project_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_project_template_items_product_id ON project_template_items(product_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_product_id ON project_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_phase ON project_materials(phase);
CREATE INDEX IF NOT EXISTS idx_claims_project_id ON claims(project_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_onsite_user_id ON claims(onsite_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_items_claim_id ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_product_id ON claim_items(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_project_id ON returns(project_id);
CREATE INDEX IF NOT EXISTS idx_returns_claim_id ON returns(claim_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects(project_id);

-- Enable Row Level Security
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for project_materials
CREATE POLICY "Allow public read access to project_materials"
  ON project_materials FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on project_materials"
  ON project_materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on project_materials"
  ON project_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on project_materials"
  ON project_materials FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for claims
CREATE POLICY "Allow public read access to claims"
  ON claims FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on claims"
  ON claims FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for claim_items
CREATE POLICY "Allow public read access to claim_items"
  ON claim_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on claim_items"
  ON claim_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on claim_items"
  ON claim_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on claim_items"
  ON claim_items FOR DELETE
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

-- RLS Policies for notifications
CREATE POLICY "Allow public read access to notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for user_projects
CREATE POLICY "Allow public read access to user_projects"
  ON user_projects FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on user_projects"
  ON user_projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on user_projects"
  ON user_projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on user_projects"
  ON user_projects FOR DELETE
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_templates_updated_at ON project_templates;
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON project_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_materials_updated_at ON project_materials;
CREATE TRIGGER update_project_materials_updated_at
  BEFORE UPDATE ON project_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claims_updated_at ON claims;
CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update user_roles enum in audit_logs to include warehouse_admin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_role'
  ) THEN
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_role_check;
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_role_check
      CHECK (user_role IN ('ceo_admin', 'warehouse_admin', 'onsite_team', 'system'));
  END IF;
END $$;

-- Update user_profiles enum to include warehouse_admin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
      CHECK (role IN ('ceo_admin', 'warehouse_admin', 'onsite_team'));
  END IF;
END $$;
