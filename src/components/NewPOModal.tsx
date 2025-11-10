import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreatePurchaseOrder, useVendorProducts } from '@/hooks/usePurchaseOrders';
import { useVendors, useProductVendors } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface NewPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  preFillData?: {
    vendorId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  };
}

interface POItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

export const NewPOModal = ({ isOpen, onClose, preFillData }: NewPOModalProps) => {
  const [vendorId, setVendorId] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [items, setItems] = useState<POItem[]>([]);
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  const { data: vendors } = useVendors();
  const { data: vendorProducts } = useVendorProducts(vendorId);
  const createPO = useCreatePurchaseOrder();

  useEffect(() => {
    if (preFillData && isOpen) {
      setVendorId(preFillData.vendorId);
      setItems([
        {
          product_id: preFillData.productId,
          quantity: preFillData.quantity,
          unit_price: preFillData.unitPrice,
        },
      ]);
    }
  }, [preFillData, isOpen]);

  const handleVendorChange = (newVendorId: string) => {
    setVendorId(newVendorId);
    setItems([]);
  };

  const handleAddItem = () => {
    if (!vendorId) {
      toast.error('Please select a vendor first');
      return;
    }
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof POItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'product_id' && vendorProducts) {
      const product = vendorProducts.find((p) => p.id === value);
      if (product) {
        newItems[index].product_name = product.product_name;
      }
    }

    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const handleSubmit = async (isDraft: boolean) => {
    setSaveAsDraft(isDraft);

    if (!vendorId) {
      toast.error('Please select a vendor');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const invalidItems = items.filter(
      (item) => !item.product_id || item.quantity < 1 || item.unit_price <= 0
    );
    if (invalidItems.length > 0) {
      toast.error('Please complete all item details with valid values');
      return;
    }

    try {
      await createPO.mutateAsync({
        vendor_id: vendorId,
        status: isDraft ? 'draft' : 'sent',
        notes: notes || undefined,
        expected_delivery_date: expectedDeliveryDate || undefined,
        items: items,
      });

      toast.success(
        isDraft ? 'Purchase order saved as draft' : 'Purchase order submitted successfully'
      );
      handleClose();
    } catch (error) {
      toast.error('Failed to create purchase order');
      console.error(error);
    }
  };

  const handleClose = () => {
    setVendorId('');
    setNotes('');
    setExpectedDeliveryDate('');
    setItems([]);
    setSaveAsDraft(false);
    onClose();
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Purchase Order</DialogTitle>
          <DialogDescription>Create a purchase order to send to a vendor</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">
              Vendor <span className="text-destructive">*</span>
            </Label>
            <Select value={vendorId} onValueChange={handleVendorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors?.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name} ({vendor.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVendor && (
              <div className="text-xs text-muted-foreground mt-2">
                Lead Time: {selectedVendor.lead_time_days} days
                {selectedVendor.contact_email && ` • ${selectedVendor.contact_email}`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_delivery">Expected Delivery Date</Label>
              <Input
                id="expected_delivery"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or special terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Line Items <span className="text-destructive">*</span>
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
                {!vendorId
                  ? 'Select a vendor first, then add items to the purchase order'
                  : 'No items added yet. Click "Add Item" to get started.'}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40%]">Product</TableHead>
                      <TableHead className="w-[20%]">Quantity</TableHead>
                      <TableHead className="w-[20%]">Unit Price</TableHead>
                      <TableHead className="w-[15%] text-right">Subtotal</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {vendorProducts?.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.product_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'unit_price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        ${calculateTotal().toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={createPO.isPending}
          >
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={createPO.isPending}>
            {createPO.isPending ? 'Submitting...' : 'Submit Purchase Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
