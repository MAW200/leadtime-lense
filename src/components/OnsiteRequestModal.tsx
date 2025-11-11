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
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';
import { useRole } from '@/contexts/RoleContext';
import { Alert, AlertDescription } from './ui/alert';

interface OnsiteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RequestItem {
  product_id: string;
  quantity_requested: number;
}

export const OnsiteRequestModal = ({ isOpen, onClose }: OnsiteRequestModalProps) => {
  const { userName, currentRole } = useRole();
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<RequestItem[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');

  const { data: products } = useInventoryItems();
  const { data: projects } = useProjects('active');
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
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const invalidItems = items.filter(item => !item.product_id || item.quantity_requested < 1);
    if (invalidItems.length > 0) {
      toast.error('Please select a product and enter a valid quantity for all items');
      return;
    }

    if (!photoUrl) {
      toast.error('Please upload a photo of the items you are taking');
      return;
    }

    const selectedProject = projects?.find(p => p.id === projectId);
    if (!selectedProject) {
      toast.error('Selected project not found');
      return;
    }

    try {
      await createRequest.mutateAsync({
        requester_name: userName,
        destination_property: selectedProject.name,
        notes: notes || undefined,
        project_id: projectId,
        photo_url: photoUrl,
        created_by_role: currentRole,
        items: items,
      });

      toast.success('Request submitted successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to submit request');
      console.error(error);
    }
  };

  const handleClose = () => {
    setProjectId('');
    setNotes('');
    setItems([]);
    setPhotoUrl('');
    onClose();
  };

  const isSubmitDisabled = !projectId || items.length === 0 || !photoUrl || createRequest.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim Inventory Items</DialogTitle>
          <DialogDescription>
            Select a project and items you need. Photo is required for audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="project">
              Project <span className="text-destructive">*</span>
            </Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project/condo" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} {project.location && `- ${project.location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                              {product.product_name} (Available: {product.in_stock - product.allocated})
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

          <PhotoUpload
            onPhotoUploaded={setPhotoUrl}
            photoUrl={photoUrl}
            required
          />

          {!photoUrl && items.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must take a photo of the items before you can submit this request.
                This is required for our audit trail.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
