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
  project_id: string | null;
  photo_url: string | null;
  created_by_role: string;
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
  project?: Project;
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
  good_quality_qty: number;
  bad_quality_qty: number;
  qa_photo_url: string | null;
  qa_completed_at: string | null;
  qa_completed_by: string | null;
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

export type Project = {
  id: string;
  name: string;
  location: string | null;
  status: 'active' | 'completed' | 'on_hold';
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: 'ceo_admin' | 'warehouse_admin' | 'onsite_team' | 'system';
  action_type: string;
  action_description: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  photo_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string | null;
  role: 'ceo_admin' | 'warehouse_admin' | 'onsite_team';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserRole = 'ceo_admin' | 'warehouse_admin' | 'onsite_team';

export type ProjectMaterial = {
  id: string;
  project_id: string;
  product_id: string;
  phase: 'P1' | 'P2a' | 'P2b';
  required_quantity: number;
  claimed_quantity: number;
  created_at: string;
  updated_at: string;
  product?: InventoryItem;
};

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectTemplateItem = {
  id: string;
  template_id: string;
  product_id: string;
  phase: 'P1' | 'P2a' | 'P2b';
  required_quantity: number;
  created_at: string;
  product?: InventoryItem;
};

export type ProjectTemplateWithItems = ProjectTemplate & {
  project_template_items?: ProjectTemplateItem[];
};

export type Claim = {
  id: string;
  claim_number: string;
  project_id: string;
  onsite_user_id: string;
  onsite_user_name: string;
  warehouse_admin_id: string | null;
  warehouse_admin_name: string | null;
  status: 'pending' | 'approved' | 'partial_approved' | 'denied';
  claim_type: 'standard' | 'emergency';
  photo_url: string;
  emergency_reason: string | null;
  denial_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  project?: Project;
};

export type ClaimItem = {
  id: string;
  claim_id: string;
  product_id: string;
  quantity_requested: number;
  quantity_approved: number;
  created_at: string;
  product?: InventoryItem;
};

export type ClaimWithItems = Claim & {
  claim_items?: ClaimItem[];
};

export type Return = {
  id: string;
  return_number: string;
  project_id: string;
  claim_id: string | null;
  onsite_user_id: string;
  onsite_user_name: string;
  warehouse_admin_id: string | null;
  warehouse_admin_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  photo_url: string;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
  project?: Project;
  claim?: Claim;
};

export type ReturnItem = {
  id: string;
  return_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: InventoryItem;
};

export type ReturnWithItems = Return & {
  return_items?: ReturnItem[];
};

export type StockAdjustment = {
  id: string;
  adjustment_number: string;
  product_id: string;
  quantity_change: number;
  reason: string;
  notes: string | null;
  previous_stock: number;
  new_stock: number;
  admin_id: string;
  admin_name: string;
  created_at: string;
  product?: InventoryItem;
};

export type Notification = {
  id: string;
  recipient_user_id: string;
  recipient_role: 'ceo_admin' | 'warehouse_admin' | 'onsite_team';
  message: string;
  notification_type: string;
  related_claim_id: string | null;
  related_return_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type UserProject = {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
  project?: Project;
};
