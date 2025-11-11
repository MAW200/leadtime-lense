import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Eye } from 'lucide-react';
import { useInternalRequests } from '@/hooks/useRequests';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { OnsiteRequestModal } from '@/components/OnsiteRequestModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InternalRequestWithItems } from '@/lib/supabase';

const OnsiteRequests = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InternalRequestWithItems | null>(null);

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

  return (
    <div className="h-full flex flex-col">
      <header className="border-b bg-card">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Requests</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View your inventory requests and their status
              </p>
            </div>
            <Button onClick={() => setIsNewRequestOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>
      </header>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base font-mono">
                          {request.request_number}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Project</div>
                        <div className="font-medium text-sm">
                          {request.project?.name || request.destination_property}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Items</div>
                        <div className="text-sm">
                          {request.request_items && request.request_items.length > 0 ? (
                            <div className="space-y-1">
                              {request.request_items.slice(0, 2).map((item) => (
                                <div key={item.id} className="flex justify-between">
                                  <span className="truncate flex-1">
                                    {item.product?.product_name}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {item.quantity_requested}x
                                  </span>
                                </div>
                              ))}
                              {request.request_items.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{request.request_items.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            'No items'
                          )}
                        </div>
                      </div>

                      {request.photo_url && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Photo</div>
                          <img
                            src={request.photo_url}
                            alt="Request photo"
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
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

      <OnsiteRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
      />

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Request Number</div>
                  <div className="font-mono font-medium">{selectedRequest.request_number}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Project</div>
                  <div className="font-medium">
                    {selectedRequest.project?.name || selectedRequest.destination_property}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div>{format(new Date(selectedRequest.created_at), 'MMM d, yyyy h:mm a')}</div>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm p-3 bg-muted rounded-lg">{selectedRequest.notes}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-2">Items</div>
                <div className="space-y-2">
                  {selectedRequest.request_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <span className="font-medium">{item.product?.product_name}</span>
                      <Badge variant="secondary">{item.quantity_requested} units</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.photo_url && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Photo</div>
                  <img
                    src={selectedRequest.photo_url}
                    alt="Request photo"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnsiteRequests;
