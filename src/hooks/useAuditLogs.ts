import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuditLog } from '@/lib/supabase';

export const useAuditLogs = (filters?: {
  actionType?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => api.auditLogs.getAll(filters),
  });
};

export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      user_name: string;
      user_role: 'ceo_admin' | 'warehouse_admin' | 'onsite_team' | 'system';
      action_type: string;
      action_description: string;
      related_entity_type?: string;
      related_entity_id?: string;
      photo_url?: string;
      metadata?: Record<string, unknown>;
    }) => {
      return api.auditLogs.create(log);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
};
