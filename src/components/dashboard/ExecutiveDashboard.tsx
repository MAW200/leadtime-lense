import { ExecutiveKPIs } from './ExecutiveKPIs';
import { ProjectBurnChart } from './ProjectBurnChart';
import { VendorPerformanceChart } from './VendorPerformanceChart';
import { ExecutiveFlowAlerts } from './ExecutiveFlowAlerts';
import { Separator } from '@/components/ui/separator';
import { ProjectStatusChart } from '@/components/charts/ProjectStatusChart';
import { useProjects } from '@/hooks/useProjects';

export const ExecutiveDashboard = () => {
  const { data: projects } = useProjects('all');
  
  // Re-use existing pie chart logic
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
  const onHoldProjects = projects?.filter(p => p.status === 'on_hold').length || 0;

  return (
    <div className="space-y-8">
      {/* 1. KPI Cards (The Headlines) */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Executive Pulse</h2>
        <ExecutiveKPIs />
      </div>

      <ExecutiveFlowAlerts />

      <Separator />

      {/* 2. Financial Efficiency Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <ProjectBurnChart />
        </div>
        <div className="lg:col-span-1">
            <ProjectStatusChart 
                activeCount={activeProjects} 
                completedCount={completedProjects} 
                onHoldCount={onHoldProjects} 
            />
        </div>
      </div>

      {/* 3. Supply Chain Performance */}
      <div>
         <VendorPerformanceChart />
      </div>
    </div>
  );
};

