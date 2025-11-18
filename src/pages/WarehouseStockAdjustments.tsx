import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { TopHeader } from '@/components/TopHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Settings } from 'lucide-react';
import { useStockAdjustments, useCreateStockAdjustment } from '@/hooks/useStockAdjustments';
import { useInventoryItems } from '@/hooks/useInventory';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

const REASONS = [
  'Damaged in Warehouse',
  'Stock Count Error',
  'Found Lost Stock',
  'Theft/Loss',
  'Expired Goods',
  'Other',
] as const;

const WarehouseStockAdjustments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<'all' | (typeof REASONS)[number]>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [productId, setProductId] = useState('');
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [reason, setReason] = useState<(typeof REASONS)[number] | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userName } = useRole();
  const { data: inventoryItems, isLoading: inventoryLoading } = useInventoryItems();
  const { data: adjustments, isLoading } = useStockAdjustments({
    reason: selectedReason === 'all' ? undefined : selectedReason,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const createAdjustment = useCreateStockAdjustment();

  const selectedProduct = useMemo(
    () => inventoryItems?.find(item => item.id === productId) ?? null,
    [inventoryItems, productId],
  );

  const projectedStock = selectedProduct ? selectedProduct.in_stock + quantityChange : null;

  const resetForm = () => {
    setProductId('');
    setQuantityChange(0);
    setReason('');
    setNotes('');
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!productId) {
      toast.error('Select a product to adjust.');
      return;
    }

    if (!quantityChange || Number.isNaN(quantityChange) || quantityChange === 0) {
      toast.error('Quantity change cannot be zero.');
      return;
    }

    if (!reason) {
      toast.error('Select a reason for the adjustment.');
      return;
    }

    if (!selectedProduct) {
      toast.error('Product not found.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdjustment.mutateAsync({
        productId,
        quantityChange,
        reason,
        notes: notes || undefined,
        adminId: userName.toLowerCase().replace(/\s+/g, '-'),
        adminName: userName,
      });
      toast.success('Stock adjustment recorded.');
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record stock adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Stock Adjustments"
        description="Review and record manual inventory corrections."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Reason</label>
                  <Select value={selectedReason} onValueChange={(value: typeof selectedReason) => setSelectedReason(value)}>
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      {REASONS.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
              </div>
              <Button variant="outline" onClick={() => { setSelectedReason('all'); setStartDate(''); setEndDate(''); }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : adjustments && adjustments.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Adjustment #</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold text-right">Change</TableHead>
                  <TableHead className="font-semibold">Reason</TableHead>
                  <TableHead className="font-semibold">Admin</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map(adjustment => (
                  <TableRow key={adjustment.id}>
                    <TableCell className="font-mono text-sm">{adjustment.adjustment_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{adjustment.product?.product_name || 'Unknown product'}</span>
                        <span className="text-xs text-muted-foreground">SKU {adjustment.product?.sku || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={adjustment.quantity_change >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                      >
                        {adjustment.quantity_change > 0 ? '+' : ''}
                        {adjustment.quantity_change}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {adjustment.previous_stock} → {adjustment.new_stock}
                      </div>
                    </TableCell>
                    <TableCell>{adjustment.reason}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{adjustment.admin_name}</span>
                        <span className="text-xs text-muted-foreground">{adjustment.admin_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {adjustment.notes ? adjustment.notes : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{format(new Date(adjustment.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No adjustments found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Stock adjustments will appear here after you record them.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Stock Adjustment</DialogTitle>
            <DialogDescription>
              Record manual inventory adjustments. Positive numbers add stock, negative numbers reduce stock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <Select value={productId} onValueChange={setProductId} disabled={inventoryLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {inventoryItems?.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col">
                        <span>{item.product_name}</span>
                        <span className="text-xs text-muted-foreground">
                          SKU {item.sku} • In stock {item.in_stock}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity Change</label>
                <Input
                  type="number"
                  value={quantityChange}
                  onChange={(event) => setQuantityChange(Number(event.target.value))}
                  placeholder="e.g. -5 or 10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Select value={reason} onValueChange={(value: typeof reason) => setReason(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Provide more detail about this adjustment (optional)"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium">Stock Impact</p>
              {selectedProduct ? (
                <p className="text-muted-foreground">
                  Current stock: <span className="font-medium">{selectedProduct.in_stock}</span> → Projected stock:{' '}
                  <span className={`font-semibold ${projectedStock !== null && projectedStock < 0 ? 'text-destructive' : ''}`}>
                    {projectedStock}
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground">Select a product to preview stock impact.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseStockAdjustments;
