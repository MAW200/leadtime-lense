import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Package, Calendar, FileText, Trash2, Pencil, Check, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PODetailDrawerProps {
    poId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'voided', label: 'Voided' },
];

export const PODetailDrawer = ({ poId, isOpen, onClose }: PODetailDrawerProps) => {
    const queryClient = useQueryClient();
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(0);
    const [editPrice, setEditPrice] = useState<number>(0);

    const { data: po, isLoading } = useQuery({
        queryKey: ['purchase-order', poId],
        queryFn: () => api.purchaseOrders.getById(poId!),
        enabled: !!poId && isOpen,
        keepPreviousData: true,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            if (!poId) return;
            return api.purchaseOrders.update(poId, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
            toast.success('Status updated successfully');
            setIsEditingStatus(false);
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });

    const deletePOMutation = useMutation({
        mutationFn: async () => {
            if (!poId) return;
            return api.purchaseOrders.delete(poId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase order deleted');
            setIsDeleteDialogOpen(false);
            onClose();
        },
        onError: () => {
            toast.error('Failed to delete purchase order');
        },
    });

    const handleStatusChange = (newStatus: string) => {
        updateStatusMutation.mutate(newStatus);
    };

    const handleDeletePO = () => {
        deletePOMutation.mutate();
    };

    const handleEditItem = (item: any) => {
        setEditingItemId(item.id);
        setEditQuantity(item.quantity);
        setEditPrice(item.unit_price);
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditQuantity(0);
        setEditPrice(0);
    };

    const handleSaveItem = async () => {
        if (!editingItemId || !poId) return;

        try {
            await api.purchaseOrders.updateItem(poId, editingItemId, {
                quantity: editQuantity,
                unit_price: editPrice,
            });

            queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Item updated');
            handleCancelEdit();
        } catch (error) {
            toast.error('Failed to update item');
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!poId) return;

        try {
            await api.purchaseOrders.deleteItem(poId, itemId);
            queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Item removed');
        } catch (error) {
            toast.error('Failed to remove item');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'secondary';
            case 'sent': return 'default';
            case 'in_transit': return 'warning';
            case 'received': return 'success';
            case 'cancelled': return 'destructive';
            case 'voided': return 'destructive';
            default: return 'outline';
        }
    };

    if (!po && !isLoading) return null;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
                    <SheetHeader>
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-2xl">{po?.po_number}</SheetTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <SheetDescription>
                            Purchase Order Details and Line Items
                        </SheetDescription>
                    </SheetHeader>

                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading...</div>
                    ) : po ? (
                        <div className="space-y-6 py-6">
                            {/* Status Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <div className="flex items-center gap-2">
                                    {isEditingStatus ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <Select
                                                value={po.status}
                                                onValueChange={handleStatusChange}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditingStatus(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Badge variant={getStatusColor(po.status) as any} className="capitalize">
                                                {po.status.replace('_', ' ')}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditingStatus(true)}
                                            >
                                                Change Status
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Order Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Vendor</label>
                                    <p className="text-sm font-medium">{po.vendor?.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Total Amount</label>
                                    {(() => {
                                        const derivedTotal =
                                            po.purchase_order_items?.reduce(
                                                (sum: number, item: any) => sum + item.quantity * item.unit_price,
                                                0
                                            ) ?? po.total_amount;
                                        return (
                                            <p className="text-sm font-mono font-semibold">
                                                ${derivedTotal.toFixed(2)}
                                            </p>
                                        );
                                    })()}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Order Date</label>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {po.order_date ? format(new Date(po.order_date), 'PPP') : '-'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Expected Delivery</label>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {po.expected_delivery_date ? format(new Date(po.expected_delivery_date), 'PPP') : '-'}
                                    </div>
                                </div>
                            </div>

                            {po.notes && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5" />
                                            Notes
                                        </label>
                                        <p className="text-sm bg-muted p-3 rounded-md">{po.notes}</p>
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* Line Items */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Order Items
                                </label>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-center">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                                <TableHead className="w-[100px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {po.purchase_order_items?.length > 0 ? (
                                                po.purchase_order_items.map((item: any) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">
                                                            {item.product?.product_name || 'Unknown Product'}
                                                        </TableCell>
                                                        {editingItemId === item.id ? (
                                                            <>
                                                                <TableCell className="text-center">
                                                                    <Input
                                                                        type="number"
                                                                        value={editQuantity}
                                                                        onChange={(e) => setEditQuantity(Number(e.target.value))}
                                                                        className="w-20 h-8 text-center"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={editPrice}
                                                                        onChange={(e) => setEditPrice(Number(e.target.value))}
                                                                        className="w-24 h-8 text-right"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono font-semibold">
                                                                    ${(editQuantity * editPrice).toFixed(2)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-green-600"
                                                                            onClick={handleSaveItem}
                                                                        >
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={handleCancelEdit}
                                                                        >
                                                                            <XIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                                <TableCell className="text-right font-mono">
                                                                    ${item.unit_price.toFixed(2)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono font-semibold">
                                                                    ${(item.subtotal ?? item.quantity * item.unit_price).toFixed(2)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleEditItem(item)}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-destructive"
                                                                            onClick={() => handleDeleteItem(item.id)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                                        No items in this order
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the purchase order
                            "{po?.po_number}" and all associated line items.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePO}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
