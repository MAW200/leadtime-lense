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

export type InternalRequest = {
  id: string;
  request_number: string;
  requester_name: string;
  requester_email: string | null;
  destination_property: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  notes: string | null;
  fulfilled_date: string | null;
  created_at: string;
  updated_at: string;
};

export type RequestItem = {
  id: string;
  request_id: string;
  product_id: string;
  quantity_requested: number;
  quantity_fulfilled: number;
  created_at: string;
  product?: InventoryItem;
};

export type InternalRequestWithItems = InternalRequest & {
  request_items?: RequestItem[];
};

export type PurchaseOrder = {
  id: string;
  po_number: string;
  vendor_id: string;
  status: 'draft' | 'sent' | 'in_transit' | 'received' | 'cancelled';
  total_amount: number;
  order_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
};

export type PurchaseOrderItem = {
  id: string;
  po_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product?: InventoryItem;
};

export type PurchaseOrderWithItems = PurchaseOrder & {
  purchase_order_items?: PurchaseOrderItem[];
};
