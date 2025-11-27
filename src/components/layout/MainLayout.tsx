import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* macOS Dynamic Island Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pb-8">
        <Outlet />
      </main>
    </div>
  );
};
