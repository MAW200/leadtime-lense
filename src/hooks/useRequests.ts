import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, InternalRequest, InternalRequestWithItems, RequestItem } from '@/lib/supabase';

export const useInternalRequests = (status?: string) => {
  return useQuery({
    queryKey: ['internal-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('internal_requests')
        .select(`
          *,
          request_items(
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
      return data as InternalRequestWithItems[];
    },
  });
};

export const useInternalRequest = (id?: string) => {
  return useQuery({
    queryKey: ['internal-request', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('internal_requests')
        .select(`
          *,
          request_items(
            *,
            product:inventory_items(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as InternalRequestWithItems | null;
    },
    enabled: !!id,
  });
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      requester_name: string;
      requester_email?: string;
      destination_property: string;
      notes?: string;
      items: { product_id: string; quantity_requested: number }[];
    }) => {
      const { data: requestNumber } = await supabase.rpc('generate_request_number');

      const { data: newRequest, error: requestError } = await supabase
        .from('internal_requests')
        .insert({
          request_number: requestNumber,
          requester_name: request.requester_name,
          requester_email: request.requester_email,
          destination_property: request.destination_property,
          notes: request.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const requestItems = request.items.map((item) => ({
        request_id: newRequest.id,
        product_id: item.product_id,
        quantity_requested: item.quantity_requested,
      }));

      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(requestItems);

      if (itemsError) throw itemsError;

      return newRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-requests'] });
    },
  });
};

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      fulfilled_date,
    }: {
      id: string;
      status: 'pending' | 'fulfilled' | 'cancelled';
      fulfilled_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('internal_requests')
        .update({
          status,
          fulfilled_date: status === 'fulfilled' ? fulfilled_date || new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['internal-request'] });
    },
  });
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('internal_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-requests'] });
    },
  });
};
