import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/hooks/useNotifications';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';

const notificationStyles: Record<string, string> = {
  claim_approved: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400',
  claim_partially_approved: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  claim_denied: 'border-destructive/40 bg-destructive/10 text-destructive',
  claim_pending_review: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  emergency_claim_alert: 'border-red-600/40 bg-red-500/10 text-red-600 dark:text-red-400',
  emergency_claim_submitted: 'border-red-600/40 bg-red-500/10 text-red-600 dark:text-red-400',
  return_pending_review: 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300',
  return_approved: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400',
  stock_adjustment_created: 'border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

const getUserIdentifier = (role: 'ceo_admin' | 'warehouse_admin' | 'onsite_team', userName: string) => {
  if (role === 'ceo_admin') return 'ceo_admin';
  if (role === 'warehouse_admin') return 'warehouse_admin';
  return userName.toLowerCase().replace(/\s+/g, '-');
};

export const NotificationBell = () => {
  const { currentRole, userName } = useRole();
  const userId = useMemo(() => getUserIdentifier(currentRole, userName), [currentRole, userName]);

  const { data: notifications } = useNotifications(userId);
  const { data: unreadCount } = useUnreadNotificationsCount(userId);
  const markNotificationAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleMarkAll = () => {
    if (!userId || !notifications?.length) return;
    markAllAsRead.mutate(userId);
  };

  const handleMarkOne = (notificationId: string) => {
    markNotificationAsRead.mutate(notificationId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Stay on top of claims, returns, and adjustments
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={handleMarkAll}
            disabled={!notifications?.length}
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        </div>

        <ScrollArea className="h-80">
          <div className="divide-y">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => {
                const style = notificationStyles[notification.notification_type] || 'border-muted bg-muted/20';
                const isUnread = notification.is_read === false;

                return (
                  <button
                    key={notification.id}
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-muted/80',
                      isUnread && 'bg-primary/5',
                    )}
                    onClick={() => isUnread && handleMarkOne(notification.id)}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        'mt-1 text-[10px] uppercase tracking-wide',
                        style,
                      )}
                    >
                      {notification.notification_type.replace(/_/g, ' ')}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2" />
                You're all caught up!
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

