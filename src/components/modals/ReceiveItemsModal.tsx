import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, AlertTriangle, Loader2, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PurchaseOrderItem {
    id: string;
    product_id: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_cost: number;
    product?: {
        id: string;
        product_name: string;
        sku: string;
    };
}

interface ReceiveItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    poId: string;
    poNumber: number;
    items: PurchaseOrderItem[];
}

interface ReceiveQuantity {
    item_id: string;
    qty: number;
}

export const ReceiveItemsModal = ({
    isOpen,
    onClose,
    poId,
    poNumber,
    items,
}: ReceiveItemsModalProps) => {
    const queryClient = useQueryClient();
    const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
    const [hasOverDelivery, setHasOverDelivery] = useState(false);

    // Initialize quantities to 0 when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialQuantities: Record<string, number> = {};
            items.forEach((item) => {
                initialQuantities[item.id] = 0;
            });
            setReceiveQuantities(initialQuantities);
            setHasOverDelivery(false);
        }
    }, [isOpen, items]);

    // Check for over-delivery whenever quantities change
    useEffect(() => {
        const hasOver = items.some((item) => {
            const receiveNow = receiveQuantities[item.id] || 0;
            const previouslyReceived = item.quantity_received || 0;
            const ordered = item.quantity_ordered || 0;
            return previouslyReceived + receiveNow > ordered;
        });
        setHasOverDelivery(hasOver);
    }, [receiveQuantities, items]);

    // Mutation for receiving items with Optimistic Updates
    const receiveItemsMutation = useMutation({
        mutationFn: async (payload: ReceiveQuantity[]) => {
            const { data, error } = await supabase.rpc('receive_po_items', {
                p_po_id: poId,
                items: payload,
            });
            
            if (error) throw error;
            return data;
        },
        
        // Optimistic Update: onMutate runs before the mutation
        onMutate: async (payload: ReceiveQuantity[]) => {
            // 1. Cancel any outgoing refetches to prevent overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ['purchase-order', poId] });
            await queryClient.cancelQueries({ queryKey: ['purchase-orders'] });

            // 2. Snapshot the previous PO data for rollback
            const previousPO = queryClient.getQueryData(['purchase-order', poId]);

            // 3. Optimistically update the cache
            queryClient.setQueryData(['purchase-order', poId], (oldData: any) => {
                if (!oldData) return oldData;

                // Create a map of item_id -> qty for quick lookup
                const receiveMap = new Map(payload.map(p => [p.item_id, p.qty]));

                // Calculate totals for status determination
                let totalOrdered = 0;
                let totalReceived = 0;

                // Update each item's quantity_received
                const updatedItems = oldData.purchase_order_items?.map((item: PurchaseOrderItem) => {
                    const qtyToAdd = receiveMap.get(item.id) || 0;
                    const newQtyReceived = (item.quantity_received || 0) + qtyToAdd;
                    
                    totalOrdered += item.quantity_ordered || 0;
                    totalReceived += newQtyReceived;

                    return {
                        ...item,
                        quantity_received: newQtyReceived,
                    };
                }) || [];

                // Determine new status based on received quantities
                let newStatus = oldData.status;
                if (totalReceived >= totalOrdered && totalOrdered > 0) {
                    newStatus = 'received';
                } else if (totalReceived > 0) {
                    newStatus = 'partial';
                }

                return {
                    ...oldData,
                    status: newStatus,
                    purchase_order_items: updatedItems,
                };
            });

            // Return context with previous data for rollback
            return { previousPO };
        },

        // Rollback on error
        onError: (error: Error, _payload, context) => {
            console.error('Failed to receive items:', error);
            
            // Roll back to the previous state
            if (context?.previousPO) {
                queryClient.setQueryData(['purchase-order', poId], context.previousPO);
            }

            toast.error('Failed to receive items', {
                description: error.message,
            });
        },

        // Success handler
        onSuccess: (data) => {
            const totalReceived = Object.values(receiveQuantities).reduce((sum, qty) => sum + qty, 0);
            
            toast.success('Items Received', {
                description: `${totalReceived} units received. Status: ${data?.new_status || 'updated'}`,
            });
            
            handleClose();
        },

        // Always refetch after error or success to ensure server state sync
        onSettled: () => {
            // Invalidate queries to sync with canonical server state
            queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
        },
    });

    const handleQuantityChange = (itemId: string, value: string) => {
        const qty = parseInt(value, 10);
        setReceiveQuantities((prev) => ({
            ...prev,
            [itemId]: isNaN(qty) || qty < 0 ? 0 : qty,
        }));
    };

    const handleSubmit = () => {
        // Build payload, filtering out items with 0 quantity
        const payload: ReceiveQuantity[] = Object.entries(receiveQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([item_id, qty]) => ({ item_id, qty }));

        if (payload.length === 0) {
            toast.error('No items to receive', {
                description: 'Please enter a quantity for at least one item.',
            });
            return;
        }

        receiveItemsMutation.mutate(payload);
    };

    const handleClose = () => {
        setReceiveQuantities({});
        onClose();
    };

    // Calculate totals
    const totalToReceive = Object.values(receiveQuantities).reduce((sum, qty) => sum + qty, 0);
    const itemsWithQuantity = Object.values(receiveQuantities).filter((qty) => qty > 0).length;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Receive Items - PO-{poNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Enter the quantity received for each item in this shipment.
                    </DialogDescription>
                </DialogHeader>

                {hasOverDelivery && (
                    <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Over-delivery detected:</strong> Some items will exceed the ordered quantity. 
                            This is allowed but please verify the quantities are correct.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex-1 overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead className="w-[40%]">Product Name</TableHead>
                                <TableHead className="text-center">Qty Ordered</TableHead>
                                <TableHead className="text-center">Previously Received</TableHead>
                                <TableHead className="text-center">Remaining</TableHead>
                                <TableHead className="text-center w-[120px]">Receive Now</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        No items on this purchase order
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const ordered = item.quantity_ordered || 0;
                                    const previouslyReceived = item.quantity_received || 0;
                                    const remaining = ordered - previouslyReceived;
                                    const receiveNow = receiveQuantities[item.id] || 0;
                                    const totalAfterReceive = previouslyReceived + receiveNow;
                                    const isOverDelivery = totalAfterReceive > ordered;
                                    const isComplete = totalAfterReceive >= ordered;

                                    return (
                                        <TableRow key={item.id} className={isOverDelivery ? 'bg-amber-50' : ''}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product?.product_name || 'Unknown Product'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {item.product?.sku || '-'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {ordered}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {previouslyReceived}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={remaining <= 0 ? 'text-green-600' : 'text-amber-600'}>
                                                    {remaining > 0 ? remaining : 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={receiveNow}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    className={`w-20 mx-auto text-center ${isOverDelivery ? 'border-amber-500' : ''}`}
                                                    disabled={receiveItemsMutation.isPending}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isComplete && receiveNow > 0 ? (
                                                    <Badge variant="default" className="bg-green-600">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Complete
                                                    </Badge>
                                                ) : receiveNow > 0 ? (
                                                    <Badge variant="outline">
                                                        +{receiveNow}
                                                    </Badge>
                                                ) : previouslyReceived >= ordered ? (
                                                    <Badge variant="default" className="bg-green-600">
                                                        Done
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        {itemsWithQuantity > 0 ? (
                            <span>
                                Receiving <strong>{totalToReceive}</strong> units across{' '}
                                <strong>{itemsWithQuantity}</strong> item(s)
                            </span>
                        ) : (
                            <span>Enter quantities to receive</span>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={receiveItemsMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={receiveItemsMutation.isPending || totalToReceive === 0}
                    >
                        {receiveItemsMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Receipt ({totalToReceive} units)
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

