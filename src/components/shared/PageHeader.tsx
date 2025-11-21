import { ReactNode } from 'react';
import { UserProfileMenu } from './UserProfileMenu';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <UserProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
