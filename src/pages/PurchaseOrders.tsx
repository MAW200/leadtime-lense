import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingCart, ClipboardCheck } from 'lucide-react';
import { usePurchaseOrders, useCompleteQAInspection } from '@/hooks/usePurchaseOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { NewPOModal } from '@/components/NewPOModal';
import { QAReceivingModal } from '@/components/QAReceivingModal';
import { useLocation } from 'react-router-dom';
import { PurchaseOrderWithItems } from '@/lib/supabase';

const PurchaseOrders = () => {
  const location = useLocation();
  const preFillData = location.state?.preFill;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewPOOpen, setIsNewPOOpen] = useState(!!preFillData);
  const [selectedPOForQA, setSelectedPOForQA] = useState<PurchaseOrderWithItems | null>(null);

  const { data: purchaseOrders, isLoading } = usePurchaseOrders(statusFilter);
  const completeQA = useCompleteQAInspection();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-gray-500 text-white hover:bg-gray-600' },
      sent: { label: 'Sent', className: 'bg-blue-500 text-white hover:bg-blue-600' },
      in_transit: { label: 'In Transit', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
      received: { label: 'Received', className: 'bg-green-500 text-white hover:bg-green-600' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500 text-white hover:bg-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b bg-card">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage purchase orders sent to vendors
              </p>
            </div>
            <Button onClick={() => setIsNewPOOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New PO
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="in_transit">In Transit</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : purchaseOrders && purchaseOrders.length > 0 ? (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">PO Number</TableHead>
                    <TableHead className="font-semibold">Vendor</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Total Cost</TableHead>
                    <TableHead className="font-semibold">Order Date</TableHead>
                    <TableHead className="font-semibold">Expected Delivery</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow
                      key={po.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium font-mono">
                        {po.po_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{po.vendor?.name}</p>
                          {po.vendor?.country && (
                            <p className="text-xs text-muted-foreground">
                              {po.vendor.country}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right font-bold">
                        ${po.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {po.order_date
                          ? format(new Date(po.order_date), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {po.expected_delivery_date
                          ? format(new Date(po.expected_delivery_date), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {po.status === 'in_transit' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPOForQA(po)}
                          >
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Receive & QA
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No purchase orders found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === 'all'
                  ? 'Create your first purchase order to get started'
                  : `No ${statusFilter.replace('_', ' ')} purchase orders at this time`}
              </p>
              <Button onClick={() => setIsNewPOOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </div>
          )}
        </div>
      </div>

      <NewPOModal
        isOpen={isNewPOOpen}
        onClose={() => setIsNewPOOpen(false)}
        preFillData={preFillData}
      />

      <QAReceivingModal
        isOpen={!!selectedPOForQA}
        onClose={() => setSelectedPOForQA(null)}
        purchaseOrder={selectedPOForQA}
        onComplete={async (qaData) => {
          await completeQA.mutateAsync(qaData);
        }}
      />
    </div>
  );
};

export default PurchaseOrders;
