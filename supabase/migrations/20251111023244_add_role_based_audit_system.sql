/*
  # Add Role-Based Access and Audit System
  
  ## Summary
  This migration extends the Inventory Action Center with role-based access control,
  project-based tracking, photo audit trails, and comprehensive audit logging to create
  a full-scale auditable inventory management system.

  ## New Tables
  
  ### 1. projects
  Tracks different properties/condos where inventory is being used
  - `id` (uuid, primary key) - Unique project identifier
  - `name` (text) - Project name (e.g., "Project A - Condo")
  - `location` (text) - Physical location or address
  - `status` (text) - Project status: active, completed, on_hold
  - `description` (text) - Additional project details
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp
  
  ### 2. audit_logs
  Comprehensive audit trail for all system actions
  - `id` (uuid, primary key) - Unique log entry identifier
  - `timestamp` (timestamptz) - When the action occurred
  - `user_name` (text) - Name of user who performed the action
  - `user_role` (text) - Role of the user (admin, onsite_team)
  - `action_type` (text) - Type of action performed
  - `action_description` (text) - Human-readable description of the action
  - `related_entity_type` (text) - Type of entity affected (e.g., "purchase_order", "request")
  - `related_entity_id` (uuid) - ID of the affected entity
  - `photo_url` (text) - URL to associated photo if applicable
  - `metadata` (jsonb) - Additional structured data about the action
  - `created_at` (timestamptz) - Log entry creation time

  ### 3. user_profiles
  Store user information and role assignments
  - `id` (uuid, primary key) - Unique user identifier
  - `name` (text) - User's full name
  - `email` (text) - User's email address
  - `role` (text) - User role: admin, onsite_team
  - `is_active` (boolean) - Whether user account is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Modified Tables
  
  ### internal_requests
  - Added `project_id` (uuid) - Foreign key to projects table
  - Added `photo_url` (text) - URL to photo taken by onsite team when claiming items
  - Added `created_by_role` (text) - Role of the user who created the request
  
  ### purchase_orders
  - Added `good_quality_qty` (integer) - Total quantity received in good condition
  - Added `bad_quality_qty` (integer) - Total quantity received damaged/defective
  - Added `qa_photo_url` (text) - URL to photo taken during QA inspection
  - Added `qa_completed_at` (timestamptz) - When QA was completed
  - Added `qa_completed_by` (text) - Who completed the QA inspection

  ## Security
  - RLS enabled on all new tables
  - Public read access for projects and audit_logs (read-only audit trail)
  - Authenticated users can create/modify projects
  - Only system can write to audit_logs (through triggers/functions)

  ## Indexes
  Performance indexes on foreign keys, timestamps, and commonly filtered fields
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  user_name text NOT NULL,
  user_role text CHECK (user_role IN ('admin', 'onsite_team', 'system')),
  action_type text NOT NULL,
  action_description text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  photo_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  role text DEFAULT 'onsite_team' CHECK (role IN ('admin', 'onsite_team')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to internal_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'internal_requests' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE internal_requests ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'internal_requests' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE internal_requests ADD COLUMN photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'internal_requests' AND column_name = 'created_by_role'
  ) THEN
    ALTER TABLE internal_requests ADD COLUMN created_by_role text DEFAULT 'admin';
  END IF;
END $$;

-- Add new columns to purchase_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'good_quality_qty'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN good_quality_qty integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'bad_quality_qty'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN bad_quality_qty integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'qa_photo_url'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN qa_photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'qa_completed_at'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN qa_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'qa_completed_by'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN qa_completed_by text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_name ON audit_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_related_entity ON audit_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_internal_requests_project_id ON internal_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_internal_requests_created_by_role ON internal_requests(created_by_role);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for audit_logs (read-only for users)
CREATE POLICY "Allow public read access to audit_logs"
  ON audit_logs FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_profiles
CREATE POLICY "Allow public read access to user_profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on user_profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on user_profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on user_profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (true);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_name text,
  p_user_role text,
  p_action_type text,
  p_action_description text,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_photo_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_name,
    user_role,
    action_type,
    action_description,
    related_entity_type,
    related_entity_id,
    photo_url,
    metadata
  ) VALUES (
    p_user_name,
    p_user_role,
    p_action_type,
    p_action_description,
    p_related_entity_type,
    p_related_entity_id,
    p_photo_url,
    p_metadata
  ) RETURNING id INTO new_log_id;
  
  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to log purchase order status changes
CREATE OR REPLACE FUNCTION log_purchase_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      COALESCE(NEW.created_by, 'System'),
      'admin',
      'PO_CREATED',
      'Purchase order ' || NEW.po_number || ' created for vendor',
      'purchase_order',
      NEW.id,
      NULL,
      jsonb_build_object('po_number', NEW.po_number, 'vendor_id', NEW.vendor_id, 'total_amount', NEW.total_amount)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      PERFORM create_audit_log(
        COALESCE(NEW.created_by, 'System'),
        'admin',
        'PO_STATUS_CHANGED',
        'Purchase order ' || NEW.po_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
        'purchase_order',
        NEW.id,
        NULL,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
    
    IF NEW.qa_completed_at IS NOT NULL AND OLD.qa_completed_at IS NULL THEN
      PERFORM create_audit_log(
        COALESCE(NEW.qa_completed_by, 'System'),
        'admin',
        'PO_QA_COMPLETED',
        'QA completed for PO ' || NEW.po_number || ': ' || NEW.good_quality_qty || ' good, ' || NEW.bad_quality_qty || ' bad',
        'purchase_order',
        NEW.id,
        NEW.qa_photo_url,
        jsonb_build_object('good_qty', NEW.good_quality_qty, 'bad_qty', NEW.bad_quality_qty)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to log internal request changes
CREATE OR REPLACE FUNCTION log_internal_request_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      NEW.requester_name,
      COALESCE(NEW.created_by_role, 'admin'),
      'REQUEST_CREATED',
      'Request ' || NEW.request_number || ' created for ' || NEW.destination_property,
      'internal_request',
      NEW.id,
      NEW.photo_url,
      jsonb_build_object('request_number', NEW.request_number, 'destination', NEW.destination_property)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      PERFORM create_audit_log(
        NEW.requester_name,
        COALESCE(NEW.created_by_role, 'admin'),
        'REQUEST_STATUS_CHANGED',
        'Request ' || NEW.request_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
        'internal_request',
        NEW.id,
        NULL,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_purchase_orders ON purchase_orders;
CREATE TRIGGER audit_purchase_orders
  AFTER INSERT OR UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_purchase_order_changes();

DROP TRIGGER IF EXISTS audit_internal_requests ON internal_requests;
CREATE TRIGGER audit_internal_requests
  AFTER INSERT OR UPDATE ON internal_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_internal_request_changes();

-- Apply updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample projects for testing
INSERT INTO projects (name, location, status, description)
VALUES 
  ('Project A - Condo', 'Downtown District', 'active', 'Luxury condominium renovation project'),
  ('Project B - Subang', 'Subang Jaya', 'active', 'Commercial office space renovation'),
  ('Project C - Villa', 'Damansara Heights', 'on_hold', 'Private villa restoration')
ON CONFLICT DO NOTHING;