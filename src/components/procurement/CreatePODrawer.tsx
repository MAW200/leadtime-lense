import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const poSchema = z.object({
    vendor_id: z.string().min(1, 'Vendor is required'),
    order_date: z.date(),
    expected_delivery_date: z.date(),
    notes: z.string().optional(),
    items: z.array(
        z.object({
            product_id: z.string().min(1, 'Product is required'),
            quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
            unit_price: z.coerce.number().min(0, 'Price must be positive'),
        })
    ).min(1, 'At least one item is required'),
});

interface CreatePODrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreatePODrawer = ({ isOpen, onClose }: CreatePODrawerProps) => {
    const queryClient = useQueryClient();
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    // Fetch Vendors
    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: api.vendors.getAll,
    });

    // Fetch Vendor Products when vendor is selected
    const { data: vendorProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['vendor-products', selectedVendorId],
        queryFn: () => api.vendors.getProducts(selectedVendorId!),
        enabled: !!selectedVendorId,
    });

    const form = useForm<z.infer<typeof poSchema>>({
        resolver: zodResolver(poSchema),
        defaultValues: {
            order_date: new Date(),
            items: [{ product_id: '', quantity: 1, unit_price: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    // Auto-calculate expected delivery date
    const watchVendorId = form.watch('vendor_id');
    const watchOrderDate = form.watch('order_date');

    useEffect(() => {
        if (watchVendorId) {
            setSelectedVendorId(watchVendorId);
            if (watchOrderDate) {
                // Default lead time of 14 days since vendors table doesn't have lead_time_days
                const deliveryDate = addDays(watchOrderDate, 14);
                form.setValue('expected_delivery_date', deliveryDate);
            }
        }
    }, [watchVendorId, watchOrderDate, form]);

    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof poSchema>) => {
            const aggregatedItems = Object.values(
                values.items.reduce((acc, item) => {
                    if (acc[item.product_id]) {
                        acc[item.product_id].quantity += item.quantity;
                        acc[item.product_id].unit_price = item.unit_price;
                    } else {
                        acc[item.product_id] = { ...item };
                    }
                    return acc;
                }, {} as Record<string, { product_id: string; quantity: number; unit_price: number }>)
            );

            const total_amount = aggregatedItems.reduce(
                (sum, item) => sum + item.quantity * item.unit_price,
                0
            );

            const poData = {
                po_number: `PO-${Date.now()}`, // Simple generation for now
                vendor_id: values.vendor_id,
                status: 'draft',
                total_amount,
                order_date: values.order_date.toISOString(),
                expected_delivery_date: values.expected_delivery_date.toISOString(),
                notes: values.notes,
                purchase_order_items: aggregatedItems.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
            };

            return api.purchaseOrders.create(poData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase Order created successfully');
            form.reset();
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to create Purchase Order');
        },
    });

    const onSubmit = (values: z.infer<typeof poSchema>) => {
        createMutation.mutate(values);
    };

    // Helper to update unit price when product is selected
    const handleProductChange = (index: number, productId: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const product = vendorProducts?.find((p: any) => p.product_id === productId);
        if (product) {
            form.setValue(`items.${index}.unit_price`, product.cost_price);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Create Purchase Order</SheetTitle>
                    <SheetDescription>
                        Create a new PO for a vendor. Delivery date is auto-calculated.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vendor_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a vendor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {vendors?.map((vendor) => (
                                                    <SelectItem key={vendor.id} value={vendor.id}>
                                                        {vendor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expected_delivery_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Expected Delivery</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date()
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {selectedVendorId && vendorProducts?.length === 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    This vendor has no linked products. Please go to the Vendor Profile to add items to their catalog before creating an order.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Order Items</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
                                    disabled={!selectedVendorId || vendorProducts?.length === 0}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md">
                                    <div className="col-span-5">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.product_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Product</FormLabel>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            handleProductChange(index, value);
                                                        }}
                                                        defaultValue={field.value}
                                                        disabled={!selectedVendorId || isLoadingProducts}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder={isLoadingProducts ? "Loading..." : "Select product"} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                            {vendorProducts?.map((vp: any) => (
                                                                <SelectItem key={vp.product_id} value={vp.product_id}>
                                                                    {vp.product?.product_name} ({vp.product_sku})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Qty</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="h-8" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unit_price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Price</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="h-8" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-end pb-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Optional notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Order
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
};
