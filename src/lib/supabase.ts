import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type InventoryItem = {
  id: string;
  product_name: string;
  sku: string;
  in_stock: number;
  allocated: number;
  consumed_30d: number;
  on_order_local_14d: number;
  on_order_shipment_a_60d: number;
  on_order_shipment_b_60d: number;
  signed_quotations: number;
  projected_stock: number;
  safety_stock: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
};

export type Vendor = {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  lead_time_days: number;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVendor = {
  id: string;
  product_id: string;
  vendor_id: string;
  is_primary: boolean;
  vendor_sku: string | null;
  unit_price: number;
  minimum_order_qty: number;
  lead_time_days: number;
  last_order_date: string | null;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  product?: InventoryItem;
};
