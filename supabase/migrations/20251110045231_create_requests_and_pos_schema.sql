/*
  # Create Requests and Purchase Orders Schema

  ## Summary
  Creates database schema for Internal Requests and Purchase Orders to extend
  the Inventory Action Center with workflow management capabilities.

  ## New Tables
  
  ### 1. internal_requests
  Tracks internal requests for inventory items from different properties/departments
  - `id` (uuid, primary key) - Unique request identifier
  - `request_number` (text, unique) - Human-readable request ID (e.g., REQ-102)
  - `requester_name` (text) - Name of person/team making the request
  - `requester_email` (text) - Contact email for requester
  - `destination_property` (text) - Target property/location for items
  - `status` (text) - Request status: pending, fulfilled, cancelled
  - `notes` (text) - Additional request notes or special instructions
  - `fulfilled_date` (timestamptz) - When request was completed
  - `created_at` (timestamptz) - Request creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ### 2. request_items
  Junction table linking requests to specific inventory items with quantities
  - `id` (uuid, primary key)
  - `request_id` (uuid, foreign key) - Reference to internal_requests
  - `product_id` (uuid, foreign key) - Reference to inventory_items
  - `quantity_requested` (integer) - Number of units requested
  - `quantity_fulfilled` (integer) - Number of units actually provided
  - `created_at` (timestamptz)

  ### 3. purchase_orders
  Tracks purchase orders sent to vendors
  - `id` (uuid, primary key) - Unique PO identifier
  - `po_number` (text, unique) - Human-readable PO number (e.g., PO-1001)
  - `vendor_id` (uuid, foreign key) - Reference to vendors table
  - `status` (text) - PO status: draft, sent, in_transit, received, cancelled
  - `total_amount` (decimal) - Total cost of purchase order
  - `order_date` (timestamptz) - When PO was created/sent
  - `expected_delivery_date` (timestamptz) - Estimated arrival date
  - `actual_delivery_date` (timestamptz) - Actual receipt date
  - `notes` (text) - Additional PO notes or terms
  - `created_by` (text) - User who created the PO
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. purchase_order_items
  Line items for each purchase order
  - `id` (uuid, primary key)
  - `po_id` (uuid, foreign key) - Reference to purchase_orders
  - `product_id` (uuid, foreign key) - Reference to inventory_items
  - `quantity` (integer) - Number of units ordered
  - `unit_price` (decimal) - Price per unit at time of order
  - `subtotal` (decimal) - Calculated: quantity × unit_price
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public read access for all tables
  - Authenticated users can insert, update, and delete records

  ## Indexes
  Performance indexes on foreign keys and status fields for efficient filtering

  ## Important Notes
  1. Request and PO numbers are auto-generated with proper sequencing
  2. Status fields use specific allowed values for consistency
  3. All tables include audit timestamps (created_at, updated_at)
  4. Cascading deletes ensure referential integrity
*/

-- Create internal_requests table
CREATE TABLE IF NOT EXISTS internal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL,
  requester_name text NOT NULL,
  requester_email text,
  destination_property text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  notes text,
  fulfilled_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create request_items junction table
CREATE TABLE IF NOT EXISTS request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES internal_requests(id) ON DELETE CASCADE,
  product_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_requested integer NOT NULL DEFAULT 1,
  quantity_fulfilled integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, product_id)
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE RESTRICT,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_transit', 'received', 'cancelled')),
  total_amount decimal(12,2) DEFAULT 0,
  order_date timestamptz,
  expected_delivery_date timestamptz,
  actual_delivery_date timestamptz,
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_order_items junction table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  subtotal decimal(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz DEFAULT now(),
  UNIQUE(po_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_requests_status ON internal_requests(status);
CREATE INDEX IF NOT EXISTS idx_internal_requests_created_at ON internal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_product_id ON request_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product_id ON purchase_order_items(product_id);

-- Enable Row Level Security
ALTER TABLE internal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internal_requests
CREATE POLICY "Allow public read access to internal_requests"
  ON internal_requests FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on internal_requests"
  ON internal_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on internal_requests"
  ON internal_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on internal_requests"
  ON internal_requests FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for request_items
CREATE POLICY "Allow public read access to request_items"
  ON request_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on request_items"
  ON request_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on request_items"
  ON request_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on request_items"
  ON request_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for purchase_orders
CREATE POLICY "Allow public read access to purchase_orders"
  ON purchase_orders FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on purchase_orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on purchase_orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on purchase_orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for purchase_order_items
CREATE POLICY "Allow public read access to purchase_order_items"
  ON purchase_order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on purchase_order_items"
  ON purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on purchase_order_items"
  ON purchase_order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on purchase_order_items"
  ON purchase_order_items FOR DELETE
  TO authenticated
  USING (true);

-- Function to auto-generate request numbers
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_number text;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(request_number FROM 'REQ-(\d+)') AS integer)),
    0
  ) + 1 INTO next_num
  FROM internal_requests;
  
  new_number := 'REQ-' || LPAD(next_num::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_number text;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(po_number FROM 'PO-(\d+)') AS integer)),
    1000
  ) + 1 INTO next_num
  FROM purchase_orders;
  
  new_number := 'PO-' || next_num::text;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to internal_requests
CREATE TRIGGER update_internal_requests_updated_at
  BEFORE UPDATE ON internal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply triggers to purchase_orders
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();