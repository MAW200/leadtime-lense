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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateRequest } from '@/hooks/useRequests';
import { useInventoryItems } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RequestItem {
  product_id: string;
  quantity_requested: number;
}

export const NewRequestModal = ({ isOpen, onClose }: NewRequestModalProps) => {
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [destinationProperty, setDestinationProperty] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<RequestItem[]>([]);

  const { data: products } = useInventoryItems();
  const createRequest = useCreateRequest();

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity_requested: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof RequestItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!requesterName || !destinationProperty || items.length === 0) {
      toast.error('Please fill in all required fields and add at least one item');
      return;
    }

    const invalidItems = items.filter(item => !item.product_id || item.quantity_requested < 1);
    if (invalidItems.length > 0) {
      toast.error('Please select a product and enter a valid quantity for all items');
      return;
    }

    try {
      await createRequest.mutateAsync({
        requester_name: requesterName,
        requester_email: requesterEmail || undefined,
        destination_property: destinationProperty,
        notes: notes || undefined,
        items: items,
      });

      toast.success('Request created successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to create request');
      console.error(error);
    }
  };

  const handleClose = () => {
    setRequesterName('');
    setRequesterEmail('');
    setDestinationProperty('');
    setNotes('');
    setItems([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Request</DialogTitle>
          <DialogDescription>
            Submit an internal request for inventory items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requester_name">
                Requester Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="requester_name"
                placeholder="e.g., Ops Team"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requester_email">Requester Email</Label>
              <Input
                id="requester_email"
                type="email"
                placeholder="ops@company.com"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_property">
              Destination Property <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination_property"
              placeholder="e.g., Property B - Subang"
              value={destinationProperty}
              onChange={(e) => setDestinationProperty(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional information or special instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Items <span className="text-destructive">*</span>
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
                No items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32 space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity_requested}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity_requested', parseInt(e.target.value) || 1)
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createRequest.isPending}>
            {createRequest.isPending ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
