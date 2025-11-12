import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TopHeader } from '@/components/TopHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';
import { useClaims } from '@/hooks/useClaims';
import { format } from 'date-fns';

const WarehouseClaimHistory = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: claims, isLoading } = useClaims(statusFilter);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
      approved: { label: 'Approved', className: 'bg-green-500 text-white hover:bg-green-600' },
      denied: { label: 'Denied', className: 'bg-red-500 text-white hover:bg-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getItemsSummary = (claim: any) => {
    if (!claim.claim_items || claim.claim_items.length === 0) {
      return 'No items';
    }

    const firstItem = claim.claim_items[0];
    const remaining = claim.claim_items.length - 1;

    return remaining > 0
      ? `${firstItem.quantity} × ${firstItem.product?.product_name} +${remaining} more`
      : `${firstItem.quantity} × ${firstItem.product?.product_name}`;
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Claim History"
        description="View all processed material claims"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="denied">Denied</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : claims && claims.length > 0 ? (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Claim ID</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Onsite Team Member</TableHead>
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Items</TableHead>
                    <TableHead className="font-semibold">Submitted</TableHead>
                    <TableHead className="font-semibold">Processed By</TableHead>
                    <TableHead className="font-semibold">Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium font-mono">
                        {claim.claim_number}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{claim.onsite_user_name}</div>
                      </TableCell>
                      <TableCell>{claim.project?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{getItemsSummary(claim)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(claim.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {claim.warehouse_admin_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {claim.processed_at
                          ? format(new Date(claim.processed_at), 'MMM d, yyyy h:mm a')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No claims found</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'all'
                  ? 'No claims have been submitted yet'
                  : `No ${statusFilter} claims at this time`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseClaimHistory;
