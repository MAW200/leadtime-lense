import { UserProfileMenu } from './UserProfileMenu';

interface TopHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const TopHeader = ({ title, description, actions }: TopHeaderProps) => {
  return (
    <header className="border-b bg-card">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {(title || description) && (
            <div>
              {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 ml-auto">
            {actions}
            <UserProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
