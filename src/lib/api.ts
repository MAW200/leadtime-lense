/**
 * API Client for Supabase
 * Replaces REST API calls with direct Supabase queries
 */

import { supabase } from './supabase';
import { fetchAllExternalProducts } from './externalApi';
import type {
  InventoryItem,
  MasterProduct,
  Project,
  Claim,
  Return,
  StockAdjustment,
  Notification,
  Vendor,
  InternalRequest,
  PurchaseOrder,
  ProjectMaterial,
  UserProject,
  ProjectTemplate,
  AuditLog,
} from './supabase';
import type {
  ProductVendor,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateClaimPayload,
  CreateReturnPayload,
  CreateStockAdjustmentPayload,
  CreateNotificationPayload,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  TemplateItemPayload,
  LinkProductToVendorPayload,
  CreateAuditLogPayload,
  CreateRequestPayload,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
  CreateProjectMaterialPayload,
  CreateUserProjectPayload,
} from './types/api';

// Helper to handle Supabase responses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponse = async <T>(query: any): Promise<T> => {
  const { data, error } = await query;
  if (error) throw error;
  return data as T;
};

// API client methods
export const api = {
  // Inventory
  inventory: {
    getAll: async () => {
      // Use external API instead of Supabase
      try {
        const products = await fetchAllExternalProducts();
        return products as InventoryItem[];
      } catch (error) {
        console.error('Failed to fetch from external API, falling back to Supabase:', error);
        // Fallback to Supabase if external API fails
        return handleResponse<InventoryItem[]>(
          supabase
            .from('inventory_items')
            .select('*, master_product:master_products(*), product_vendors(is_primary, vendor:vendors(name))')
            .order('created_at', { ascending: false })
        );
      }
    },
    getMasters: () =>
      handleResponse<MasterProduct[]>(supabase.from('master_products').select('*').order('name')),
    getById: (id: string) =>
      handleResponse<InventoryItem>(
        supabase
          .from('inventory_items')
          .select('*, master_product:master_products(*)')
          .eq('id', id)
          .single()
      ),
    getVendors: (id: string) =>
      handleResponse<ProductVendor[]>(
        supabase.from('product_vendors').select('*, vendor:vendors(*)').eq('product_id', id)
      ),
    createMaster: (data: Partial<MasterProduct>) =>
      handleResponse<MasterProduct>(supabase.from('master_products').insert(data).select().single()),
    createVariant: (data: Partial<InventoryItem>) =>
      handleResponse<InventoryItem>(supabase.from('inventory_items').insert(data).select().single()),
  },

  // Projects
  projects: {
    getAll: (status?: string, userId?: string) => {
      let query = supabase.from('projects').select('*, user_projects!left(user_id)');

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (userId) {
        // This uses the !inner join to filter projects where the user is assigned
        query = supabase.from('projects').select('*, user_projects!inner(user_id)').eq('user_projects.user_id', userId);
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
      }

      return handleResponse<Project[]>(query);
    },
    getById: (id: string) =>
      handleResponse<Project>(supabase.from('projects').select('*').eq('id', id).single()),
    getMaterials: (id: string) =>
      handleResponse<ProjectMaterial[]>(
        supabase.from('project_materials').select('*, product:inventory_items(*)').eq('project_id', id)
      ),
    create: (data: CreateProjectPayload) => handleResponse<Project>(supabase.from('projects').insert(data).select().single()),
    update: (id: string, data: UpdateProjectPayload) =>
      handleResponse<Project>(supabase.from('projects').update(data).eq('id', id).select().single()),
    delete: (id: string) => handleResponse(supabase.from('projects').delete().eq('id', id)),
    assignTemplate: async (projectId: string, templateId: string) => {
      // 1. Update project with template_id
      await handleResponse(
        supabase.from('projects').update({ template_id: templateId }).eq('id', projectId)
      );

      // 2. Fetch template items
      const template = await handleResponse<any>(
        supabase
          .from('project_templates')
          .select('*, project_template_items(*)')
          .eq('id', templateId)
          .single()
      );

      if (!template || !template.project_template_items) {
        throw new Error('Template not found or has no items');
      }

      // 3. Upsert template items to project_materials
      // Using upsert to handle existing materials gracefully
      const materials = template.project_template_items.map((item: any) => ({
        project_id: projectId,
        product_id: item.product_id,
        phase: item.phase,
        required_quantity: item.required_quantity,
        claimed_quantity: 0,
      }));

      return handleResponse(
        supabase.from('project_materials')
          .upsert(materials, {
            onConflict: 'project_id,product_id,phase',
            ignoreDuplicates: false
          })
      );
    },
  },

  // Claims
  claims: {
    getAll: (filters?: { projectId?: string; status?: string }) => {
      let query = supabase.from('claims').select('*, project:projects(*)');
      if (filters?.projectId) query = query.eq('project_id', filters.projectId);
      if (filters?.status) query = query.eq('status', filters.status);
      return handleResponse<Claim[]>(query);
    },
    getPending: () =>
      handleResponse<Claim[]>(
        supabase.from('claims').select('*, project:projects(*)').eq('status', 'pending')
      ),
    getById: (id: string) =>
      handleResponse<Claim>(
        supabase
          .from('claims')
          .select('*, project:projects(*), claim_items(*, product:inventory_items(*))')
          .eq('id', id)
          .single()
      ),
    create: async (data: CreateClaimPayload) => {
      const { claim_items, ...claimData } = data;
      const claim = await handleResponse<Claim>(
        supabase.from('claims').insert(claimData).select().single()
      );

      if (claim_items && claim_items.length > 0) {
        const items = claim_items.map((item) => ({ ...item, claim_id: claim.id }));
        await handleResponse(supabase.from('claim_items').insert(items));
      }

      return claim;
    },
    approve: async (id: string, approvalQuantities: Record<string, number>) => {
      // Update claim status
      const claim = await handleResponse<Claim>(
        supabase
          .from('claims')
          .update({ status: 'approved', processed_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single()
      );

      // Update item quantities and project materials
      for (const [itemId, qty] of Object.entries(approvalQuantities)) {
        const claimItem = await handleResponse(
          supabase.from('claim_items').update({ quantity_approved: qty }).eq('id', itemId).select('*').single()
        );

        if (claimItem?.product_id && claim?.project_id && qty > 0) {
          const material = await handleResponse(
            supabase
              .from('project_materials')
              .select('id, claimed_quantity, required_quantity')
              .eq('project_id', claim.project_id)
              .eq('product_id', claimItem.product_id)
              .single()
          );

          if (material) {
            const newClaimed = Math.min((material.claimed_quantity || 0) + qty, material.required_quantity || qty);
            await handleResponse(
              supabase.from('project_materials').update({ claimed_quantity: newClaimed }).eq('id', material.id)
            );
          }
        }
      }

      if (claim?.onsite_user_id) {
        await handleResponse(
          supabase.from('notifications').insert({
            recipient_user_id: claim.onsite_user_id,
            recipient_role: 'onsite_team',
            message: `Claim ${claim.claim_number} has been approved.`,
            notification_type: 'claim_update',
            related_claim_id: claim.id,
            is_read: false,
          })
        );
      }
    },
    deny: async (id: string, denialReason: string, denialNotes?: string) => {
      const claim = await handleResponse<Claim>(
        supabase
          .from('claims')
          .update({
            status: 'denied',
            denial_reason: denialReason,
            notes: denialNotes,
            processed_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')
          .single()
      );

      if (claim?.onsite_user_id) {
        await handleResponse(
          supabase.from('notifications').insert({
            recipient_user_id: claim.onsite_user_id,
            recipient_role: 'onsite_team',
            message: `Claim ${claim.claim_number} has been denied.`,
            notification_type: 'claim_update',
            related_claim_id: claim.id,
            is_read: false,
          })
        );
      }
    },
  },

  // Returns
  returns: {
    getAll: (status?: string) => {
      let query = supabase.from('returns').select('*, project:projects(*), claim:claims(*)');
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      return handleResponse<Return[]>(query);
    },
    getPending: () =>
      handleResponse<Return[]>(
        supabase.from('returns').select('*, project:projects(*), claim:claims(*)').eq('status', 'pending')
      ),
    create: async (data: CreateReturnPayload) => {
      const { return_items, ...returnData } = data;
      const ret = await handleResponse<Return>(
        supabase.from('returns').insert(returnData).select().single()
      );

      if (return_items && return_items.length > 0) {
        const items = return_items.map((item) => ({ ...item, return_id: ret.id }));
        await handleResponse(supabase.from('return_items').insert(items));
      }

      return ret;
    },
    approve: (id: string) =>
      handleResponse(
        supabase
          .from('returns')
          .update({ status: 'approved', processed_at: new Date().toISOString() })
          .eq('id', id)
      ),
    reject: (id: string, rejectReason: string, rejectNotes?: string) =>
      handleResponse(
        supabase
          .from('returns')
          .update({
            status: 'rejected',
            reason: rejectReason,
            notes: rejectNotes,
            processed_at: new Date().toISOString(),
          })
          .eq('id', id)
      ),
  },

  // Stock Adjustments
  stockAdjustments: {
    getAll: (filters?: { reason?: string; startDate?: string; endDate?: string }) => {
      let query = supabase.from('stock_adjustments').select('*, product:inventory_items(*)');
      if (filters?.reason) query = query.eq('reason', filters.reason);
      if (filters?.startDate) query = query.gte('created_at', filters.startDate);
      if (filters?.endDate) query = query.lte('created_at', filters.endDate);
      return handleResponse<StockAdjustment[]>(query);
    },
    create: (data: CreateStockAdjustmentPayload) =>
      handleResponse<StockAdjustment>(supabase.from('stock_adjustments').insert(data).select().single()),
  },

  // Notifications
  notifications: {
    getAll: (userId?: string, role?: string) => {
      let query = supabase.from('notifications').select('*');
      if (userId) query = query.eq('recipient_user_id', userId);
      if (role) query = query.eq('recipient_role', role);
      return handleResponse<Notification[]>(query);
    },
    getUnreadCount: async (userId?: string, role?: string) => {
      let query = supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
      if (userId) query = query.eq('recipient_user_id', userId);
      if (role) query = query.eq('recipient_role', role);
      const { count, error } = await query;
      if (error) throw error;
      return { count };
    },
    create: (data: CreateNotificationPayload) =>
      handleResponse<Notification>(supabase.from('notifications').insert(data).select().single()),
    markAsRead: (id: string) =>
      handleResponse(supabase.from('notifications').update({ is_read: true }).eq('id', id)),
    markAllAsRead: (userId: string, role: string) =>
      handleResponse(
        supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('recipient_user_id', userId)
          .eq('recipient_role', role)
      ),
  },

  // Project Templates
  projectTemplates: {
    getAll: () => handleResponse<ProjectTemplate[]>(supabase.from('project_templates').select('*')),
    getById: (id: string) =>
      handleResponse<ProjectTemplate>(
        supabase
          .from('project_templates')
          .select('*, project_template_items(*, product:inventory_items(*))')
          .eq('id', id)
          .single()
      ),
    create: (data: CreateTemplatePayload) =>
      handleResponse<ProjectTemplate>(supabase.from('project_templates').insert(data).select().single()),
    update: (id: string, data: UpdateTemplatePayload) =>
      handleResponse<ProjectTemplate>(
        supabase.from('project_templates').update(data).eq('id', id).select().single()
      ),
    delete: (id: string) => handleResponse(supabase.from('project_templates').delete().eq('id', id)),
    addItem: (templateId: string, data: TemplateItemPayload) =>
      handleResponse(supabase.from('project_template_items').insert({ ...data, template_id: templateId })),
    updateItem: (templateId: string, itemId: string, data: Partial<TemplateItemPayload>) =>
      handleResponse(supabase.from('project_template_items').update(data).eq('id', itemId).eq('template_id', templateId)),
    deleteItem: (templateId: string, itemId: string) =>
      handleResponse(supabase.from('project_template_items').delete().eq('id', itemId).eq('template_id', templateId)),
  },

  // Vendors
  vendors: {
    getAll: () => handleResponse<Vendor[]>(supabase.from('vendors').select('*').order('name')),
    getById: (id: string) =>
      handleResponse<Vendor>(supabase.from('vendors').select('*').eq('id', id).single()),
    create: (data: Partial<Vendor>) =>
      handleResponse<Vendor>(supabase.from('vendors').insert(data).select().single()),
    update: (id: string, data: Partial<Vendor>) =>
      handleResponse<Vendor>(supabase.from('vendors').update(data).eq('id', id).select().single()),
    getProducts: (id: string) =>
      handleResponse<ProductVendor[]>(
        supabase.from('product_vendors').select('*, product:inventory_items(*)').eq('vendor_id', id)
      ),
    linkProduct: (data: LinkProductToVendorPayload) =>
      handleResponse(supabase.from('product_vendors').insert(data).select().single()),
  },

  // Audit Logs
  auditLogs: {
    getAll: (filters?: { actionType?: string; userName?: string; startDate?: string; endDate?: string }) => {
      let query = supabase.from('audit_logs').select('*');
      if (filters?.actionType) query = query.eq('action_type', filters.actionType);
      if (filters?.userName) query = query.eq('user_name', filters.userName);
      if (filters?.startDate) query = query.gte('timestamp', filters.startDate);
      if (filters?.endDate) query = query.lte('timestamp', filters.endDate);
      return handleResponse<AuditLog[]>(query);
    },
    create: (data: CreateAuditLogPayload) =>
      handleResponse<AuditLog>(supabase.from('audit_logs').insert(data).select().single()),
  },

  // Requests
  requests: {
    getAll: (status?: string) => {
      let query = supabase.from('internal_requests').select('*');
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      return handleResponse<InternalRequest[]>(query);
    },
    getById: (id: string) =>
      handleResponse<InternalRequest>(
        supabase
          .from('internal_requests')
          .select('*, request_items(*, product:inventory_items(*)), project:projects(*)')
          .eq('id', id)
          .single()
      ),
    create: async (data: CreateRequestPayload) => {
      const { request_items, ...requestData } = data;
      const req = await handleResponse<InternalRequest>(
        supabase.from('internal_requests').insert(requestData).select().single()
      );

      if (request_items && request_items.length > 0) {
        const items = request_items.map((item) => ({ ...item, request_id: req.id }));
        await handleResponse(supabase.from('request_items').insert(items));
      }

      return req;
    },
    updateStatus: (id: string, status: string, fulfilledDate?: string) =>
      handleResponse(
        supabase
          .from('internal_requests')
          .update({ status, fulfilled_date: fulfilledDate })
          .eq('id', id)
      ),
  },

  // Purchase Orders
  purchaseOrders: {
    getAll: (status?: string, vendorId?: string) => {
      let query = supabase.from('purchase_orders').select('*, vendor:vendors(*)');
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      return handleResponse<PurchaseOrder[]>(query);
    },
    getById: (id: string) =>
      handleResponse<PurchaseOrder>(
        supabase
          .from('purchase_orders')
          .select('*, purchase_order_items(*, product:inventory_items(*)), vendor:vendors(*)')
          .eq('id', id)
          .single()
      ),
    create: async (data: CreatePurchaseOrderPayload) => {
      const { purchase_order_items, ...poData } = data;
      const po = await handleResponse<PurchaseOrder>(
        supabase.from('purchase_orders').insert(poData).select().single()
      );

      if (purchase_order_items && purchase_order_items.length > 0) {
        const items = purchase_order_items.map((item) => ({ ...item, po_id: po.id }));
        await handleResponse(supabase.from('purchase_order_items').insert(items));
      }

      return po;
    },
    update: (id: string, data: UpdatePurchaseOrderPayload) =>
      handleResponse<PurchaseOrder>(
        supabase.from('purchase_orders').update(data).eq('id', id).select().single()
      ),
    delete: (id: string) =>
      handleResponse(supabase.from('purchase_orders').delete().eq('id', id)),
    updateItem: (poId: string, itemId: string, data: { quantity_ordered?: number; unit_cost?: number }) =>
      handleResponse(
        supabase.from('purchase_order_items').update(data).eq('id', itemId).eq('po_id', poId)
      ),
    deleteItem: (poId: string, itemId: string) =>
      handleResponse(
        supabase.from('purchase_order_items').delete().eq('id', itemId).eq('po_id', poId)
      ),
    addItem: (data: { po_id: string; product_id: string; quantity_ordered: number; unit_cost: number }) =>
      handleResponse(
        supabase.from('purchase_order_items').insert(data).select('*, product:inventory_items(*)').single()
      ),
  },

  // Project Materials
  projectMaterials: {
    getByProject: (projectId: string) =>
      handleResponse<ProjectMaterial[]>(
        supabase.from('project_materials').select('*, product:inventory_items(*)').eq('project_id', projectId)
      ),
    create: (data: CreateProjectMaterialPayload) =>
      handleResponse<ProjectMaterial>(supabase.from('project_materials').insert(data).select().single()),
  },

  // User Projects
  userProjects: {
    getByUser: (userId: string) =>
      handleResponse<UserProject[]>(
        supabase.from('user_projects').select('*, project:projects(*)').eq('user_id', userId)
      ),
    getByProject: (projectId: string) =>
      handleResponse<UserProject[]>(
        supabase.from('user_projects').select('*').eq('project_id', projectId)
      ),
    assign: (data: CreateUserProjectPayload) =>
      handleResponse<UserProject>(supabase.from('user_projects').insert(data).select().single()),
    remove: (id: string) => handleResponse(supabase.from('user_projects').delete().eq('id', id)),
  },
};

export default api;
