import { TopHeader } from '@/components/TopHeader';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

const WarehouseStockAdjustments = () => {
  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Stock Adjustments"
        description="Manage manual inventory adjustments for stock corrections"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No adjustments yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Stock adjustments will appear here. Use the "New Adjustment" button to record inventory corrections.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseStockAdjustments;
