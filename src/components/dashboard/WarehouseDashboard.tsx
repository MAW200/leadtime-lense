import { WarehouseKPIs } from './WarehouseKPIs';
import { StockHealthChart } from './StockHealthChart';
import { WarehouseTrafficChart } from './WarehouseTrafficChart';
import { BadApplesChart } from './BadApplesChart';
import { Separator } from '@/components/ui/separator';

export const WarehouseDashboard = () => {
  return (
    <div className="space-y-8">
      {/* 1. KPI Cards (Action Items) */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Command Center</h2>
        <WarehouseKPIs />
      </div>

      <Separator />

      {/* 2. Operational Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockHealthChart />
        <WarehouseTrafficChart />
      </div>

      {/* 3. Loss Prevention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <BadApplesChart />
      </div>
    </div>
  );
};

