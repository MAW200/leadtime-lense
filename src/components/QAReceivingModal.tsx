import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PurchaseOrderWithItems } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useRole } from '@/contexts/RoleContext';

interface QAReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrderWithItems | null;
  onComplete: (data: {
    po_id: string;
    good_quality_qty: number;
    bad_quality_qty: number;
    qa_photo_url: string;
    qa_completed_by: string;
  }) => Promise<void>;
}

interface QAItem {
  product_id: string;
  product_name: string;
  ordered_qty: number;
  good_qty: number;
  bad_qty: number;
}

export const QAReceivingModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onComplete,
}: QAReceivingModalProps) => {
  const { userName } = useRole();
  const [qaItems, setQAItems] = useState<QAItem[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initializeQAItems = () => {
    if (!purchaseOrder?.purchase_order_items) return;

    const items = purchaseOrder.purchase_order_items.map(item => ({
      product_id: item.product_id,
      product_name: item.product?.product_name || 'Unknown Product',
      ordered_qty: item.quantity,
      good_qty: item.quantity,
      bad_qty: 0,
    }));

    setQAItems(items);
  };

  const handleOpen = () => {
    if (isOpen && purchaseOrder) {
      initializeQAItems();
      setPhotoUrl('');
    }
  };

  useState(() => {
    if (isOpen) {
      handleOpen();
    }
  });

  const handleQAChange = (index: number, field: 'good_qty' | 'bad_qty', value: number) => {
    const newItems = [...qaItems];
    const item = newItems[index];

    if (field === 'good_qty') {
      item.good_qty = Math.max(0, Math.min(value, item.ordered_qty));
      item.bad_qty = item.ordered_qty - item.good_qty;
    } else {
      item.bad_qty = Math.max(0, Math.min(value, item.ordered_qty));
      item.good_qty = item.ordered_qty - item.bad_qty;
    }

    setQAItems(newItems);
  };

  const getTotalGood = () => qaItems.reduce((sum, item) => sum + item.good_qty, 0);
  const getTotalBad = () => qaItems.reduce((sum, item) => sum + item.bad_qty, 0);

  const handleSubmit = async () => {
    if (!purchaseOrder) return;

    if (!photoUrl) {
      toast.error('Please upload a photo of the received shipment');
      return;
    }

    const totalOrdered = qaItems.reduce((sum, item) => sum + item.ordered_qty, 0);
    const totalCounted = getTotalGood() + getTotalBad();

    if (totalCounted !== totalOrdered) {
      toast.error(`Total counted (${totalCounted}) must equal total ordered (${totalOrdered})`);
      return;
    }

    try {
      setSubmitting(true);
      await onComplete({
        po_id: purchaseOrder.id,
        good_quality_qty: getTotalGood(),
        bad_quality_qty: getTotalBad(),
        qa_photo_url: photoUrl,
        qa_completed_by: userName,
      });

      toast.success('QA inspection completed successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to complete QA inspection');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setQAItems([]);
    setPhotoUrl('');
    onClose();
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive & QA Shipment</DialogTitle>
          <DialogDescription>
            Inspect received items and record good vs bad quality quantities for {purchaseOrder.po_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              For each item, enter the quantity received in good condition and any defective/damaged units.
              The totals must match the ordered quantities.
            </AlertDescription>
          </Alert>

          {qaItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold text-center">Ordered</TableHead>
                    <TableHead className="font-semibold text-center">Good Quality</TableHead>
                    <TableHead className="font-semibold text-center">Bad Quality</TableHead>
                    <TableHead className="font-semibold text-center">Total Counted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qaItems.map((item, index) => {
                    const totalCounted = item.good_qty + item.bad_qty;
                    const isValid = totalCounted === item.ordered_qty;

                    return (
                      <TableRow key={item.product_id} className={!isValid ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-center font-bold">{item.ordered_qty}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.ordered_qty}
                            value={item.good_qty}
                            onChange={(e) =>
                              handleQAChange(index, 'good_qty', parseInt(e.target.value) || 0)
                            }
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.ordered_qty}
                            value={item.bad_qty}
                            onChange={(e) =>
                              handleQAChange(index, 'bad_qty', parseInt(e.target.value) || 0)
                            }
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell className={`text-center font-bold ${!isValid ? 'text-destructive' : 'text-green-600'}`}>
                          {totalCounted}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Totals</TableCell>
                    <TableCell className="text-center">
                      {qaItems.reduce((sum, item) => sum + item.ordered_qty, 0)}
                    </TableCell>
                    <TableCell className="text-center text-green-600">{getTotalGood()}</TableCell>
                    <TableCell className="text-center text-red-600">{getTotalBad()}</TableCell>
                    <TableCell className="text-center">
                      {getTotalGood() + getTotalBad()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <PhotoUpload
            onPhotoUploaded={setPhotoUrl}
            photoUrl={photoUrl}
            bucketName="qa-photos"
            required
          />

          {!photoUrl && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must upload a photo of the received shipment to complete the QA inspection.
                This photo will be part of the permanent audit trail.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm font-medium">QA Summary</div>
              <div className="text-xs text-muted-foreground mt-1">
                Review the totals before submitting
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getTotalGood()}</div>
                <div className="text-xs text-muted-foreground">Good Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getTotalBad()}</div>
                <div className="text-xs text-muted-foreground">Bad Quality</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!photoUrl || submitting}
          >
            {submitting ? 'Processing...' : 'Complete QA Inspection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
