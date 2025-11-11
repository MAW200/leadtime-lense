import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Plus, FileText } from 'lucide-react';
import { useInternalRequests } from '@/hooks/useRequests';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { NewRequestModal } from '@/components/NewRequestModal';

const Requests = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  const { data: requests, isLoading } = useInternalRequests(statusFilter);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
      fulfilled: { label: 'Fulfilled', className: 'bg-green-500 text-white hover:bg-green-600' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-500 text-white hover:bg-gray-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getItemsSummary = (request: { request_items?: Array<{ quantity_requested: number; product?: { product_name: string } }> }) => {
    if (!request.request_items || request.request_items.length === 0) {
      return 'No items';
    }

    const firstItem = request.request_items[0];
    const remaining = request.request_items.length - 1;

    return remaining > 0
      ? `${firstItem.quantity_requested} × ${firstItem.product?.product_name} +${remaining} more`
      : `${firstItem.quantity_requested} × ${firstItem.product?.product_name}`;
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Internal Requests"
        description="Track and manage inventory requests from different properties"
        actions={
          <Button onClick={() => setIsNewRequestOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Request ID</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Requested By</TableHead>
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Items</TableHead>
                    <TableHead className="font-semibold">Photo</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium font-mono">
                        {request.request_number}
                        {request.created_by_role === 'onsite_team' && (
                          <Badge variant="outline" className="ml-2 text-xs">Onsite</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.requester_name}</p>
                          {request.requester_email && (
                            <p className="text-xs text-muted-foreground">
                              {request.requester_email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.project?.name || request.destination_property}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getItemsSummary(request)}
                      </TableCell>
                      <TableCell>
                        {request.photo_url ? (
                          <img
                            src={request.photo_url}
                            alt="Request"
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">No photo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === 'all'
                  ? 'Create your first request to get started'
                  : `No ${statusFilter} requests at this time`}
              </p>
              <Button onClick={() => setIsNewRequestOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </div>
          )}
        </div>
      </div>

      <NewRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
      />
    </div>
  );
};

export default Requests;
