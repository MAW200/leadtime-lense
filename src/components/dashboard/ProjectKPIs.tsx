import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { HardHat, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRole } from '@/contexts/RoleContext';

export const ProjectKPIs = () => {
  const { currentRole } = useRole();
  // Simulate user ID for onsite team demo if needed, or pass undefined for overall view
  const userId = currentRole === 'onsite_team' ? 'u3' : undefined; 
  
  const { data, isLoading } = useProjectMetrics(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="ACTIVE PROJECTS"
        value={data?.activeProjectsCount || 0}
        icon={HardHat}
        iconBgColor="bg-orange-500"
        description="Projects currently in progress"
      />
      <MetricCard
        title="EMERGENCY CLAIMS"
        value={data?.claimRatio.emergency || 0}
        icon={AlertOctagon}
        iconBgColor="bg-destructive"
        description="Unplanned material requests"
        bgColor="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
      />
      <MetricCard
        title="COMPLETED PHASES"
        value={0} // Placeholder - logic needs to check fully claimed phases
        icon={CheckCircle2}
        iconBgColor="bg-green-500"
        description="Phases with 100% material claimed"
      />
    </div>
  );
};

