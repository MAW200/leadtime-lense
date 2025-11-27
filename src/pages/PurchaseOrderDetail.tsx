import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    ArrowLeft, 
    Building2, 
    FileText, 
    Package, 
    Truck,
    Plus,
    Trash2,
    ShoppingCart,
    CheckCircle,
    Search,
    Loader2,
    DollarSign,
    Calendar,
    Hash,
    PackageCheck,
    Undo2,
    AlertTriangle,
    Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopHeader } from '@/components/navigation/TopHeader';
import { ReceiveItemsModal } from '@/components/modals/ReceiveItemsModal';
import { InvoiceUpload } from '@/components/procurement/InvoiceUpload';
import { ThreeWayMatch } from '@/components/procurement/ThreeWayMatch';
import { useRole } from '@/contexts/RoleContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Add Item Form Schema
const addItemSchema = z.object({
    product_id: z.string().uuid('Please select a product'),
    quantity_ordered: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    unit_cost: z.coerce.number().min(0, 'Unit cost must be positive'),
});

type AddItemFormValues = z.infer<typeof addItemSchema>;

const PurchaseOrderDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isPurchaser, isFinance, isWarehouse } = useRole();
    
    // Can receive items: Purchasers, Warehouse staff, and Admins
    const canReceiveItems = isPurchaser || isWarehouse;
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [productSearchOpen, setProductSearchOpen] = useState(false);
    const [isAddingItem, setIsAddingItem] = useState(false);

    // Fetch PO details
    const { data: po, isLoading, error } = useQuery({
        queryKey: ['purchase-order', id],
        queryFn: () => api.purchaseOrders.getById(id!),
        enabled: !!id,
    });

    // Fetch products for the combobox
    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ['inventory-items'],
        queryFn: () => api.inventory.getAll(),
    });

    // Form for adding items
    const form = useForm<AddItemFormValues>({
        resolver: zodResolver(addItemSchema),
        defaultValues: {
            product_id: '',
            quantity_ordered: 1,
            unit_cost: 0,
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => api.purchaseOrders.update(id!, { status }),
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            if (status === 'ordered') {
                toast.success('Order Placed', {
                    description: 'The purchase order has been placed successfully.',
                });
            } else if (status === 'draft') {
                toast.success('Order Reverted', {
                    description: 'The purchase order has been reverted to draft status.',
                });
            } else {
                toast.success('Purchase order status updated');
            }
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });

    // Add item mutation
    const addItemMutation = useMutation({
        mutationFn: (data: AddItemFormValues) => 
            api.purchaseOrders.addItem({
                po_id: id!,
                product_id: data.product_id,
                quantity_ordered: data.quantity_ordered,
                unit_cost: data.unit_cost,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
            toast.success('Item added successfully');
            form.reset({ product_id: '', quantity_ordered: 1, unit_cost: 0 });
            setIsAddingItem(false);
        },
        onError: (error: Error) => {
            console.error('Failed to add item:', error);
            toast.error('Failed to add item');
        },
    });

    // Delete item mutation
    const deleteItemMutation = useMutation({
        mutationFn: (itemId: string) => api.purchaseOrders.deleteItem(id!, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
            toast.success('Item removed');
        },
        onError: () => {
            toast.error('Failed to remove item');
        },
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

    // Check if PO is editable (only draft status allows editing)
    // Only purchasers can edit draft POs
    const isEditable = po?.status === 'draft' && isPurchaser;

    // Calculate total from items in real-time
    const totalAmount = useMemo(() => {
        const items = (po as any)?.purchase_order_items || [];
        return items.reduce(
            (sum: number, item: any) => sum + ((item.quantity_ordered || 0) * (item.unit_cost || 0)),
            0
        );
    }, [(po as any)?.purchase_order_items]);

    // Handle product selection - auto-fill unit cost
    const handleProductSelect = (productId: string) => {
        const product = products?.find((p) => p.id === productId);
        if (product) {
            form.setValue('product_id', productId);
            form.setValue('unit_cost', product.unit_cost || 0);
        }
        setProductSearchOpen(false);
    };

    const onSubmitItem = (values: AddItemFormValues) => {
        addItemMutation.mutate(values);
    };

    // Get selected product for display
    const selectedProduct = products?.find((p) => p.id === form.watch('product_id'));

    if (isLoading) {
        return (
            <div className="h-full flex flex-col">
                <div className="px-8 py-6 space-y-6">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (error || !po) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Purchase Order Not Found</h2>
                <p className="text-muted-foreground mb-4">
                    The purchase order you're looking for doesn't exist.
                </p>
                <Button onClick={() => navigate('/purchase-orders')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Purchase Orders
                </Button>
            </div>
        );
    }

    const items = (po as any).purchase_order_items || [];

    return (
        <div className="h-full flex flex-col">
            <TopHeader
                title={`PO-${po.po_number}`}
                description={`Purchase Order for ${po.vendor?.name || 'Unknown Vendor'}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/purchase-orders')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        {po.status === 'draft' && isPurchaser && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        disabled={updateStatusMutation.isPending || items.length === 0}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Place Order
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            Confirm Place Order
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3">
                                            <p>
                                                Are you sure you want to place this order? This will:
                                            </p>
                                            <ul className="list-disc list-inside space-y-1 text-sm">
                                                <li>Send the order to <strong>{po.vendor?.name}</strong></li>
                                                <li>Lock the line items (no more edits)</li>
                                                <li>Trigger an email notification to the vendor</li>
                                            </ul>
                                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                                <p className="text-sm font-medium">Order Summary:</p>
                                                <p className="text-lg font-bold">{items.length} items • ${totalAmount.toFixed(2)}</p>
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => updateStatusMutation.mutate('ordered')}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {updateStatusMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Placing...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                                    Yes, Place Order
                                                </>
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {po.status === 'ordered' && (
                            <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            <Undo2 className="h-4 w-4 mr-2" />
                                            Undo Order
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <Undo2 className="h-5 w-5 text-amber-500" />
                                                Undo Placed Order?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <p>
                                                    This will revert the purchase order back to <strong>Draft</strong> status.
                                                </p>
                                                <p className="mt-2 text-amber-600">
                                                    Note: If an email was already sent to the vendor, you may need to contact them separately.
                                                </p>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep as Ordered</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => updateStatusMutation.mutate('draft')}
                                                variant="outline"
                                            >
                                                {updateStatusMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Reverting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Undo2 className="h-4 w-4 mr-2" />
                                                        Yes, Revert to Draft
                                                    </>
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            <Truck className="h-4 w-4 mr-2" />
                                            Mark Partial Receipt
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <Truck className="h-5 w-5 text-blue-500" />
                                                Confirm Partial Receipt
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="space-y-3">
                                                <p>
                                                    Are you sure you want to mark this order as <strong>Partially Received</strong>?
                                                </p>
                                                <p className="text-sm">
                                                    This indicates that some items from the order have been received, but the order is not yet complete.
                                                </p>
                                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                                    <p className="text-sm font-medium">Order: PO-{po.po_number}</p>
                                                    <p className="text-sm text-muted-foreground">Vendor: {po.vendor?.name}</p>
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => updateStatusMutation.mutate('partial')}
                                            >
                                                {updateStatusMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Truck className="h-4 w-4 mr-2" />
                                                        Yes, Mark Partial
                                                    </>
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        {(po.status === 'ordered' || po.status === 'partial') && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        <PackageCheck className="h-4 w-4 mr-2" />
                                        Mark Fully Received
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <PackageCheck className="h-5 w-5 text-green-500" />
                                            Confirm Full Receipt
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3">
                                            <p>
                                                Are you sure you want to mark this order as <strong>Fully Received</strong>?
                                            </p>
                                            <p className="text-sm">
                                                This indicates that all items from the order have been received and the order is complete.
                                            </p>
                                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">Order: PO-{po.po_number}</p>
                                                <p className="text-sm text-green-700 dark:text-green-300">{items.length} items • ${totalAmount.toFixed(2)}</p>
                                            </div>
                                            <p className="text-sm text-amber-600">
                                                <strong>Note:</strong> This action cannot be undone. The order will be marked as complete.
                                            </p>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => updateStatusMutation.mutate('received')}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {updateStatusMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Yes, Mark as Received
                                                </>
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {(po.status === 'ordered' || po.status === 'partial') && canReceiveItems && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsReceiveModalOpen(true)}
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                                <Package className="h-4 w-4 mr-2" />
                                Receive Items
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                {/* PO Header Information */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                PO Number
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold font-mono">PO-{po.po_number}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Vendor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold truncate">
                                {po.vendor?.name || 'Unknown'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Expected Delivery
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">
                                {(po as any).expected_delivery 
                                    ? format(new Date((po as any).expected_delivery), 'PPP') 
                                    : '-'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Total Cost
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-primary">
                                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge 
                        variant={getStatusColor(po.status) as any} 
                        className="text-sm capitalize"
                    >
                        {po.status?.replace('_', ' ')}
                    </Badge>
                </div>

                {/* Tabs for Items and Financials */}
                <Tabs defaultValue="items" className="w-full">
                    <TabsList className={cn(
                        "grid w-full max-w-md",
                        isFinance ? "grid-cols-2" : "grid-cols-1"
                    )}>
                        <TabsTrigger value="items" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Line Items
                        </TabsTrigger>
                        {isFinance && (
                            <TabsTrigger value="financials" className="flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Financials
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="items" className="space-y-6 mt-6">
                        {/* Add Item Form (only for draft POs - read-only after placing order) */}
                        {isEditable && (
                            <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Add Line Item
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitItem)} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-4">
                                        {/* Product Search Combobox */}
                                        <FormField
                                            control={form.control}
                                            name="product_id"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col md:col-span-2">
                                                    <FormLabel>Product</FormLabel>
                                                    <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        'w-full justify-between',
                                                                        !field.value && 'text-muted-foreground'
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        <span className="truncate">
                                                                            {selectedProduct?.product_name}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="flex items-center gap-2">
                                                                            <Search className="h-4 w-4" />
                                                                            Search products...
                                                                        </span>
                                                                    )}
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[400px] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Search by name or SKU..." />
                                                                <CommandList>
                                                                    <CommandEmpty>
                                                                        {productsLoading ? 'Loading...' : 'No products found.'}
                                                                    </CommandEmpty>
                                                                    <CommandGroup>
                                                                        {products?.map((product) => (
                                                                            <CommandItem
                                                                                key={product.id}
                                                                                value={`${product.product_name} ${product.sku}`}
                                                                                onSelect={() => handleProductSelect(product.id)}
                                                                            >
                                                                                <div className="flex items-center justify-between w-full">
                                                                                    <div>
                                                                                        <p className="font-medium">{product.product_name}</p>
                                                                                        <p className="text-xs text-muted-foreground font-mono">
                                                                                            {product.sku}
                                                                                        </p>
                                                                                    </div>
                                                                                    <span className="text-sm font-mono">
                                                                                        ${product.unit_cost?.toFixed(2) || '0.00'}
                                                                                    </span>
                                                                                </div>
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Quantity */}
                                        <FormField
                                            control={form.control}
                                            name="quantity_ordered"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            placeholder="1"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Unit Cost (auto-filled but editable) */}
                                        <FormField
                                            control={form.control}
                                            name="unit_cost"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Unit Cost ($)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={addItemMutation.isPending || !form.watch('product_id')}
                                        >
                                            {addItemMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Line Item
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {/* Line Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Line Items ({items.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-center">Qty Ordered</TableHead>
                                        <TableHead className="text-center">Qty Received</TableHead>
                                        <TableHead className="text-right">Unit Cost</TableHead>
                                        <TableHead className="text-right">Line Total</TableHead>
                                        {isEditable && (
                                            <TableHead className="w-12"></TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell 
                                                colSpan={isEditable ? 7 : 6} 
                                                className="text-center py-12 text-muted-foreground"
                                            >
                                                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium">No items added yet</p>
                                                <p className="text-sm">
                                                    {isEditable 
                                                        ? 'Use the form above to add line items to this purchase order.'
                                                        : 'This purchase order has no items.'}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item: any) => {
                                            const lineTotal = (item.quantity_ordered || 0) * (item.unit_cost || 0);
                                            const qtyReceived = item.quantity_received || 0;
                                            const qtyOrdered = item.quantity_ordered || 0;
                                            const isFullyReceived = qtyReceived >= qtyOrdered;
                                            const isPartiallyReceived = qtyReceived > 0 && qtyReceived < qtyOrdered;
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        {item.product?.product_name || 'Unknown Product'}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                                        {item.product?.sku || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {item.quantity_ordered}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={cn(
                                                                "font-medium",
                                                                isFullyReceived && "text-green-600",
                                                                isPartiallyReceived && "text-amber-600"
                                                            )}>
                                                                {qtyReceived}
                                                            </span>
                                                            {isFullyReceived && (
                                                                <Badge variant="default" className="bg-green-600 text-xs">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Done
                                                                </Badge>
                                                            )}
                                                            {isPartiallyReceived && (
                                                                <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                                                                    {qtyOrdered - qtyReceived} left
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        ${(item.unit_cost || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">
                                                        ${lineTotal.toFixed(2)}
                                                    </TableCell>
                                                    {isEditable && (
                                                        <TableCell>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => deleteItemMutation.mutate(item.id)}
                                                                disabled={deleteItemMutation.isPending}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                    )}
                                    {items.length > 0 && (
                                        <TableRow className="bg-primary/5 border-t-2">
                                            <TableCell 
                                                colSpan={5} 
                                                className="text-right font-bold text-lg"
                                            >
                                                Total
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-lg text-primary">
                                                ${totalAmount.toFixed(2)}
                                            </TableCell>
                                            {isEditable && <TableCell />}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                    </TabsContent>

                    {isFinance && (
                        <TabsContent value="financials" className="mt-6 space-y-6">
                            {/* Three-Way Match Visualizer */}
                            <ThreeWayMatch poId={id!} poNumber={po.po_number} />
                            
                            {/* Invoice Upload */}
                            <InvoiceUpload poId={id!} poNumber={po.po_number} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            {/* Receive Items Modal */}
            <ReceiveItemsModal
                isOpen={isReceiveModalOpen}
                onClose={() => setIsReceiveModalOpen(false)}
                poId={id!}
                poNumber={po.po_number}
                items={items}
            />
        </div>
    );
};

export default PurchaseOrderDetail;
