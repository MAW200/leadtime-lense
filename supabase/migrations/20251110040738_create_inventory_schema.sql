-- Create Inventory Action Center Schema
--
-- Summary: Creates core database schema for the Inventory Action Center including 
-- inventory items, vendors, and product-vendor relationships with full supply chain tracking.
--
-- Tables Created:
-- 1. vendors - Supplier/vendor information
-- 2. inventory_items - Product inventory with stock levels and pipeline data
-- 3. product_vendors - Many-to-many relationship between products and vendors
--
-- Security: RLS enabled on all tables with policies for authenticated users

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  lead_time_days integer DEFAULT 14,
  country text DEFAULT 'USA',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  sku text UNIQUE NOT NULL,
  in_stock integer DEFAULT 0,
  allocated integer DEFAULT 0,
  consumed_30d integer DEFAULT 0,
  on_order_local_14d integer DEFAULT 0,
  on_order_shipment_a_60d integer DEFAULT 0,
  on_order_shipment_b_60d integer DEFAULT 0,
  signed_quotations integer DEFAULT 0,
  projected_stock integer DEFAULT 0,
  safety_stock integer DEFAULT 25,
  unit_cost decimal(10,2) DEFAULT 125.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_vendors junction table
CREATE TABLE IF NOT EXISTS product_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  vendor_sku text,
  unit_price decimal(10,2) DEFAULT 0,
  minimum_order_qty integer DEFAULT 1,
  lead_time_days integer DEFAULT 14,
  last_order_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, vendor_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_product_vendors_product_id ON product_vendors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_vendors_vendor_id ON product_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors
CREATE POLICY "Allow public read access to vendors"
  ON vendors FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on vendors"
  ON vendors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on vendors"
  ON vendors FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for inventory_items
CREATE POLICY "Allow public read access to inventory_items"
  ON inventory_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on inventory_items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on inventory_items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on inventory_items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for product_vendors
CREATE POLICY "Allow public read access to product_vendors"
  ON product_vendors FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on product_vendors"
  ON product_vendors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on product_vendors"
  ON product_vendors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on product_vendors"
  ON product_vendors FOR DELETE
  TO authenticated
  USING (true);