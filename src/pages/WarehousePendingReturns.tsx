import { TopHeader } from '@/components/TopHeader';
import { PackageX } from 'lucide-react';

const WarehousePendingReturns = () => {
  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Pending Returns"
        description="Review and process damaged goods returns from onsite team members"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
          <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending returns</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            All returns have been processed. New return requests will appear here when submitted by onsite team members.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehousePendingReturns;
