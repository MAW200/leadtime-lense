import { WarehouseSidebar } from './WarehouseSidebar';

export const WarehouseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WarehouseSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
