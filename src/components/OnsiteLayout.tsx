import { ReactNode } from 'react';
import { OnsiteSidebar } from './OnsiteSidebar';

interface OnsiteLayoutProps {
  children: ReactNode;
}

export const OnsiteLayout = ({ children }: OnsiteLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <OnsiteSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
