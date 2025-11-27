-- Fix RLS to allow public/anon access (since no real Auth is implemented yet)

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated full access on master_products" ON master_products;
DROP POLICY IF EXISTS "Allow authenticated full access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Superadmin full access on master_products" ON master_products;
DROP POLICY IF EXISTS "Warehouse Admin manage master_products" ON master_products;
DROP POLICY IF EXISTS "Onsite Team view master_products" ON master_products;
DROP POLICY IF EXISTS "Superadmin full access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Warehouse Admin manage inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Onsite Team view inventory_items" ON inventory_items;

-- 2. Create Public/Anon Policies
CREATE POLICY "Allow public full access on master_products" ON master_products
    FOR ALL USING (true);

CREATE POLICY "Allow public full access on inventory_items" ON inventory_items
    FOR ALL USING (true);

-- 3. Insert Dummy Data (if not exists)
DO $$
DECLARE
    master_id_1 UUID;
    master_id_2 UUID;
BEGIN
    -- Check if Nippon Paint exists
    SELECT id INTO master_id_1 FROM master_products WHERE name = 'Nippon Paint' LIMIT 1;

    IF master_id_1 IS NULL THEN
        INSERT INTO master_products (name, description)
        VALUES ('Nippon Paint', 'Premium interior and exterior paints')
        RETURNING id INTO master_id_1;
    END IF;

    -- Variants for Nippon Paint (Insert only if not exists to avoid duplicates if run multiple times)
    IF NOT EXISTS (SELECT 1 FROM inventory_items WHERE sku = 'NP-WHT-5L') THEN
        INSERT INTO inventory_items (
            master_product_id, product_name, sku, in_stock, unit_cost, safety_stock, 
            allocated, consumed_30d, on_order_local_14d, on_order_shipment_a_60d, 
            on_order_shipment_b_60d, signed_quotations, projected_stock
        ) VALUES 
        (
            master_id_1, 'Nippon Paint - White 5L', 'NP-WHT-5L', 
            50, 45.00, 10, 
            5, 120, 20, 0, 0, 0, 45
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM inventory_items WHERE sku = 'NP-GRY-1L') THEN
        INSERT INTO inventory_items (
            master_product_id, product_name, sku, in_stock, unit_cost, safety_stock, 
            allocated, consumed_30d, on_order_local_14d, on_order_shipment_a_60d, 
            on_order_shipment_b_60d, signed_quotations, projected_stock
        ) VALUES 
        (
            master_id_1, 'Nippon Paint - Grey 1L', 'NP-GRY-1L', 
            120, 12.50, 20, 
            15, 60, 0, 50, 0, 0, 105
        );
    END IF;

    -- Master Product 2: Makita Power Tools
    SELECT id INTO master_id_2 FROM master_products WHERE name = 'Makita Power Tools' LIMIT 1;

    IF master_id_2 IS NULL THEN
        INSERT INTO master_products (name, description)
        VALUES ('Makita Power Tools', 'Professional grade power tools')
        RETURNING id INTO master_id_2;
    END IF;

    -- Variants for Makita
    IF NOT EXISTS (SELECT 1 FROM inventory_items WHERE sku = 'MKT-DRL-18V') THEN
        INSERT INTO inventory_items (
            master_product_id, product_name, sku, in_stock, unit_cost, safety_stock,
            allocated, consumed_30d, on_order_local_14d, on_order_shipment_a_60d, 
            on_order_shipment_b_60d, signed_quotations, projected_stock
        ) VALUES 
        (
            master_id_2, 'Makita Cordless Drill 18V', 'MKT-DRL-18V', 
            15, 180.00, 5, 
            2, 8, 5, 0, 0, 0, 13
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM inventory_items WHERE sku = 'MKT-GRD-4IN') THEN
        INSERT INTO inventory_items (
            master_product_id, product_name, sku, in_stock, unit_cost, safety_stock,
            allocated, consumed_30d, on_order_local_14d, on_order_shipment_a_60d, 
            on_order_shipment_b_60d, signed_quotations, projected_stock
        ) VALUES 
        (
            master_id_2, 'Makita Angle Grinder', 'MKT-GRD-4IN', 
            8, 120.00, 3, 
            0, 4, 0, 10, 0, 0, 8
        );
    END IF;

END $$;
