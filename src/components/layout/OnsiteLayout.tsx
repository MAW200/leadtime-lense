import { Outlet } from 'react-router-dom';
import { OnsiteSidebar } from '../navigation/OnsiteSidebar';

export const OnsiteLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* macOS Dynamic Island Navigation */}
      <OnsiteSidebar />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pb-8">
        <Outlet />
      </main>
    </div>
  );
};
