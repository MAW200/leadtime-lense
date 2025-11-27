import { Outlet } from 'react-router-dom';
import { WarehouseSidebar } from '../navigation/WarehouseSidebar';

export const WarehouseLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* macOS Dynamic Island Navigation */}
      <WarehouseSidebar />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pb-8">
        <Outlet />
      </main>
    </div>
  );
};
