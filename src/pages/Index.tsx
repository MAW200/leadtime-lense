import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { WarehouseDashboard } from '@/components/dashboard/WarehouseDashboard';
import { ProjectDashboard } from '@/components/dashboard/ProjectDashboard';
import { TopHeader } from "@/components/navigation/TopHeader";
import { useRole } from "@/contexts/RoleContext";

const Index = () => {
  const { currentRole } = useRole();

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Dashboard"
        description="Analytics and insights for inventory management"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {currentRole === 'ceo_admin' ? (
           <ExecutiveDashboard />
        ) : currentRole === 'warehouse_admin' ? (
           <WarehouseDashboard />
        ) : (
           <ProjectDashboard />
        )}
      </div>
    </div>
  );
};

export default Index;
