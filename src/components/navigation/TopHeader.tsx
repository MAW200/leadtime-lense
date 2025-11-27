import { UserProfileMenu } from './UserProfileMenu';
import { NotificationBell } from '@/components/shared/NotificationBell';

interface TopHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const TopHeader = ({ title, description, actions }: TopHeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          {(title || description) && (
            <div className="flex-1">
              {title && (
                <h1 className="text-3xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground/80 mt-2">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Actions & Profile Section with Rounded Container */}
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-muted/30 border border-border/30">
            {actions && (
              <div className="flex items-center gap-2 pr-3 border-r border-border/30">
                {actions}
              </div>
            )}
            <NotificationBell />
            <UserProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
