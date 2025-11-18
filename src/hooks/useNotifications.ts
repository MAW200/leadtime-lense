import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/supabase';
import { useRole } from '@/contexts/RoleContext';

export const useNotifications = (userId?: string) => {
  const { currentRole } = useRole();
  
  return useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    refetchInterval: 30000,
    queryFn: () => api.notifications.getAll(userId, currentRole),
  });
};

export const useUnreadNotificationsCount = (userId?: string) => {
  const { currentRole } = useRole();
  
  return useQuery({
    queryKey: ['notifications', 'unread', userId],
    enabled: !!userId,
    refetchInterval: 30000,
    queryFn: async () => {
      const result = await api.notifications.getUnreadCount(userId, currentRole);
      return result.count || 0;
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return api.notifications.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { currentRole } = useRole();

  return useMutation({
    mutationFn: async (userId: string) => {
      return api.notifications.markAllAsRead(userId, currentRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
