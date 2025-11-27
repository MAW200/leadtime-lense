import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePendingClaims } from '@/hooks/useClaims';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardList } from 'lucide-react';

export const WarehouseAlerts = () => {
  const { data: pendingClaims, isLoading } = usePendingClaims();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          Pending Claims
        </CardTitle>
        <p className="text-sm text-muted-foreground">Quick view of requests awaiting processing</p>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-[320px]">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading claims...</p>
            ) : pendingClaims && pendingClaims.length > 0 ? (
              pendingClaims.slice(0, 6).map((claim) => (
                <div key={claim.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{claim.claim_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {claim.project?.name || 'Unknown project'} • {claim.claim_items?.length || 0} items
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">All caught up! No pending claims.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

