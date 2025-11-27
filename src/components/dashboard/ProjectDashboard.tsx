import { ProjectKPIs } from './ProjectKPIs';
import { PhaseProgressChart } from './PhaseProgressChart';
import { EmergencyRatioChart } from './EmergencyRatioChart';
import { ProjectAssignmentsWidget } from './ProjectAssignmentsWidget';
import { Separator } from '@/components/ui/separator';

export const ProjectDashboard = () => {
  return (
    <div className="space-y-8">
      {/* 1. KPI Cards */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Project Tracker</h2>
        <ProjectKPIs />
      </div>

      <Separator />

      {/* 2. Progress & Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <PhaseProgressChart />
          <ProjectAssignmentsWidget />
        </div>
        <div className="lg:col-span-1">
           <EmergencyRatioChart />
        </div>
      </div>
    </div>
  );
};

