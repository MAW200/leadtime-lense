import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, AuditLog } from '@/lib/supabase';

export const useAuditLogs = (filters?: {
  actionType?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.actionType && filters.actionType !== 'all') {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.userName) {
        query = query.ilike('user_name', `%${filters.userName}%`);
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as AuditLog[];
    },
  });
};

export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      user_name: string;
      user_role: 'admin' | 'onsite_team' | 'system';
      action_type: string;
      action_description: string;
      related_entity_type?: string;
      related_entity_id?: string;
      photo_url?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('create_audit_log', {
        p_user_name: log.user_name,
        p_user_role: log.user_role,
        p_action_type: log.action_type,
        p_action_description: log.action_description,
        p_related_entity_type: log.related_entity_type || null,
        p_related_entity_id: log.related_entity_id || null,
        p_photo_url: log.photo_url || null,
        p_metadata: log.metadata || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
};
