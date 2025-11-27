import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopHeader } from '@/components/navigation/TopHeader';
import { api } from '@/lib/api';
import { useQueryParam } from '@/hooks/useQueryParam';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreatePO } from '@/components/procurement/CreatePO';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PurchaseOrders = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusParam, setStatusParam] = useQueryParam('po_status');
  const navigate = useNavigate();

  useEffect(() => {
    if (!statusParam) {
      setStatusFilter('all');
      return;
    }
    setStatusFilter(statusParam);
  }, [statusParam]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['purchase-orders', statusFilter],
    queryFn: () => api.purchaseOrders.getAll(statusFilter),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'ordered': return 'default';
      case 'partial': return 'outline';
      case 'received': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredOrders = orders?.filter((po) =>
    String(po.po_number).toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Purchase Orders"
        description="Track and manage procurement orders"
        actions={
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'draft', 'ordered', 'partial', 'received'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(status);
                  setStatusParam(status === 'all' ? null : status);
                }}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px] mx-auto" />
                      <Skeleton className="h-4 w-[200px] mx-auto" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No purchase orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.vendor?.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(po.status) as any} className="capitalize">
                        {po.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {po.order_date ? new Date(po.order_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {po.expected_delivery_date ? (
                        <span className={new Date(po.expected_delivery_date) < new Date() && po.status !== 'received' ? 'text-destructive font-medium' : ''}>
                          {new Date(po.expected_delivery_date).toLocaleDateString()}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${po.total_amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreatePO
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

    </div>
  );
};

export default PurchaseOrders;
