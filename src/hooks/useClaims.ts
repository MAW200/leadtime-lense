import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Claim, ClaimWithItems } from '@/lib/supabase';

export const useClaims = (status?: string) => {
  return useQuery({
    queryKey: ['claims', status],
    queryFn: async () => {
      let query = supabase
        .from('claims')
        .select(`
          *,
          project:projects(*),
          claim_items(
            *,
            product:inventory_items(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ClaimWithItems[];
    },
  });
};

export const usePendingClaims = () => {
  return useQuery({
    queryKey: ['claims', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          project:projects(*),
          claim_items(
            *,
            product:inventory_items(*)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClaimWithItems[];
    },
  });
};

export const useCreateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      onsiteUserId: string;
      onsiteUserName: string;
      photoUrl: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
    }) => {
      const { data: claimNumberData } = await supabase.rpc('generate_claim_number');
      const claimNumber = claimNumberData as string;

      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert({
          claim_number: claimNumber,
          project_id: params.projectId,
          onsite_user_id: params.onsiteUserId,
          onsite_user_name: params.onsiteUserName,
          photo_url: params.photoUrl,
          notes: params.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (claimError) throw claimError;

      const claimItems = params.items.map((item) => ({
        claim_id: claim.id,
        product_id: item.productId,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('claim_items')
        .insert(claimItems);

      if (itemsError) throw itemsError;

      await supabase.from('audit_logs').insert({
        user_name: params.onsiteUserName,
        user_role: 'onsite_team',
        action_type: 'claim_initiated',
        action_description: `Initiated claim ${claimNumber} for project`,
        related_entity_type: 'claim',
        related_entity_id: claim.id,
        photo_url: params.photoUrl,
        metadata: { claim_number: claimNumber, project_id: params.projectId },
      });

      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });
};

export const useApproveClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      claimId: string;
      warehouseAdminId: string;
      warehouseAdminName: string;
    }) => {
      const { data: claim, error: fetchError } = await supabase
        .from('claims')
        .select(`
          *,
          claim_items(
            *,
            product:inventory_items(*)
          )
        `)
        .eq('id', params.claimId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('claims')
        .update({
          status: 'approved',
          warehouse_admin_id: params.warehouseAdminId,
          warehouse_admin_name: params.warehouseAdminName,
          processed_at: new Date().toISOString(),
        })
        .eq('id', params.claimId);

      if (updateError) throw updateError;

      for (const item of claim.claim_items) {
        const { error: inventoryError } = await supabase
          .from('inventory_items')
          .update({
            in_stock: (item.product.in_stock - item.quantity),
          })
          .eq('id', item.product_id);

        if (inventoryError) throw inventoryError;

        const { data: bomItem } = await supabase
          .from('project_materials')
          .select('*')
          .eq('project_id', claim.project_id)
          .eq('product_id', item.product_id)
          .maybeSingle();

        if (bomItem) {
          await supabase
            .from('project_materials')
            .update({
              claimed_quantity: bomItem.claimed_quantity + item.quantity,
            })
            .eq('id', bomItem.id);
        }
      }

      const { data: ceoAdmins } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'ceo_admin');

      if (ceoAdmins) {
        const notifications = ceoAdmins.map((admin) => ({
          recipient_user_id: admin.id,
          message: `${claim.onsite_user_name} claimed products for project. Approved by ${params.warehouseAdminName}.`,
          related_claim_id: params.claimId,
          is_read: false,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      await supabase.from('audit_logs').insert({
        user_name: params.warehouseAdminName,
        user_role: 'warehouse_admin',
        action_type: 'claim_approved',
        action_description: `Approved claim ${claim.claim_number}`,
        related_entity_type: 'claim',
        related_entity_id: params.claimId,
        metadata: { claim_number: claim.claim_number, onsite_user: claim.onsite_user_name },
      });

      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['projectMaterials'] });
    },
  });
};

export const useDenyClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      claimId: string;
      warehouseAdminId: string;
      warehouseAdminName: string;
      reason?: string;
    }) => {
      const { data: claim, error: fetchError } = await supabase
        .from('claims')
        .select('*')
        .eq('id', params.claimId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('claims')
        .update({
          status: 'denied',
          warehouse_admin_id: params.warehouseAdminId,
          warehouse_admin_name: params.warehouseAdminName,
          processed_at: new Date().toISOString(),
          notes: params.reason ? `${claim.notes ? claim.notes + '\n\n' : ''}Denial reason: ${params.reason}` : claim.notes,
        })
        .eq('id', params.claimId);

      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert({
        user_name: params.warehouseAdminName,
        user_role: 'warehouse_admin',
        action_type: 'claim_denied',
        action_description: `Denied claim ${claim.claim_number}`,
        related_entity_type: 'claim',
        related_entity_id: params.claimId,
        metadata: {
          claim_number: claim.claim_number,
          onsite_user: claim.onsite_user_name,
          reason: params.reason
        },
      });

      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });
};
