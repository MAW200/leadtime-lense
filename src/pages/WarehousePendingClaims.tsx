import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TopHeader } from '@/components/TopHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, User, Package } from 'lucide-react';
import { usePendingClaims } from '@/hooks/useClaims';
import { format } from 'date-fns';

const WarehousePendingClaims = () => {
  const { data: claims, isLoading } = usePendingClaims();

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Pending Claims"
        description="Review and approve material claims from onsite team members"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : claims && claims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {claims.map((claim) => (
              <Card
                key={claim.id}
                className="hover:shadow-lg transition-shadow border-2 hover:border-blue-600"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base font-mono">
                        {claim.claim_number}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(claim.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-xs text-muted-foreground">Team Member</div>
                        <div className="font-medium text-sm">{claim.onsite_user_name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-xs text-muted-foreground">Project</div>
                        <div className="font-medium text-sm">
                          {claim.project?.name || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Items</div>
                      {claim.claim_items && claim.claim_items.length > 0 ? (
                        <div className="space-y-1">
                          {claim.claim_items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm bg-muted/50 p-2 rounded"
                            >
                              <span className="truncate flex-1">
                                {item.product?.product_name}
                              </span>
                              <span className="ml-2 font-medium">{item.quantity}x</span>
                            </div>
                          ))}
                          {claim.claim_items.length > 2 && (
                            <div className="text-xs text-muted-foreground pl-2">
                              +{claim.claim_items.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No items</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    Review Claim
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending claims</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              All claims have been processed. New claims will appear here when submitted by onsite team members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehousePendingClaims;
