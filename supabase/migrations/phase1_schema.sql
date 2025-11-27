-- Phase 1: Core Architecture & Product Hierarchy

-- 1. Create Master Products Table
CREATE TABLE IF NOT EXISTS master_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update Inventory Items (Variants)
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS master_product_id UUID REFERENCES master_products(id);

-- 3. Create Vendor Products Table (if not exists, ensuring robust link)
CREATE TABLE IF NOT EXISTS vendor_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    vendor_sku TEXT,
    unit_price DECIMAL(10, 2),
    minimum_order_qty INTEGER DEFAULT 1,
    lead_time_days INTEGER,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Superadmin (CEO) - Full Access
CREATE POLICY "Superadmin full access on master_products" ON master_products
    FOR ALL USING (auth.jwt() ->> 'role' = 'ceo_admin');

CREATE POLICY "Superadmin full access on inventory_items" ON inventory_items
    FOR ALL USING (auth.jwt() ->> 'role' = 'ceo_admin');

-- Warehouse Admin - Manage Access
CREATE POLICY "Warehouse Admin manage master_products" ON master_products
    FOR ALL USING (auth.jwt() ->> 'role' = 'warehouse_admin');

CREATE POLICY "Warehouse Admin manage inventory_items" ON inventory_items
    FOR ALL USING (auth.jwt() ->> 'role' = 'warehouse_admin');

-- Onsite Team - View Only (Assigned Projects Logic will be added in Phase 4, for now allow view all or restrict)
-- PRD says: "Onsite Team: Restricted access via Mobile. Can only view assigned Projects, BOM"
-- For Inventory browsing, they might need to see products to request them.
-- Let's allow Read access for now.
CREATE POLICY "Onsite Team view master_products" ON master_products
    FOR SELECT USING (auth.jwt() ->> 'role' = 'onsite_team');

CREATE POLICY "Onsite Team view inventory_items" ON inventory_items
    FOR SELECT USING (auth.jwt() ->> 'role' = 'onsite_team');

-- Helper for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_master_products_updated_at
    BEFORE UPDATE ON master_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
