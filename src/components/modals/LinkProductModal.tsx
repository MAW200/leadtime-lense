import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const linkProductSchema = z.object({
    product_id: z.string().min(1, 'Product is required'),
    vendor_sku: z.string().optional(),
    unit_price: z.coerce.number().min(0, 'Price must be positive'),
    minimum_order_qty: z.coerce.number().min(1, 'MOQ must be at least 1'),
    lead_time_days: z.coerce.number().min(0, 'Lead time must be positive'),
    is_primary: z.boolean().default(false),
});

interface LinkProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string;
    vendorLeadTime: number;
}

export const LinkProductModal = ({ isOpen, onClose, vendorId, vendorLeadTime }: LinkProductModalProps) => {
    const queryClient = useQueryClient();

    // Fetch all inventory items (variants) to link
    // In a real app, we might want to filter out already linked products
    const { data: products } = useQuery({
        queryKey: ['inventory-items'],
        queryFn: api.inventory.getAll,
    });

    const form = useForm<z.infer<typeof linkProductSchema>>({
        resolver: zodResolver(linkProductSchema),
        defaultValues: {
            product_id: '',
            vendor_sku: '',
            unit_price: 0,
            minimum_order_qty: 1,
            lead_time_days: vendorLeadTime,
            is_primary: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof linkProductSchema>) => {
            // We need to use supabase directly or add a specific API method for product_vendors
            // Since api.vendors.getProducts exists, we should probably add api.vendors.linkProduct
            // For now, I'll assume we can use a direct insert via a new API method I'll add shortly
            // or use a generic 'create' if I made one. 
            // Let's assume I'll add `api.vendors.linkProduct` next.

            // Wait, I can't assume. I need to check api.ts. 
            // I'll add the method to api.ts in the next step.
            // For now, I will use a placeholder call that I will implement.
            return api.vendors.linkProduct({
                vendor_id: vendorId,
                ...values,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });
            toast.success('Product linked successfully');
            form.reset();
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to link product');
        },
    });

    const onSubmit = (values: z.infer<typeof linkProductSchema>) => {
        createMutation.mutate(values);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Link Product to Vendor</DialogTitle>
                    <DialogDescription>
                        Add a product to this vendor's catalog. Set specific pricing and lead times.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="product_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a product" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {products?.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.product_name} ({product.sku})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vendor_sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor SKU</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. V-123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Price ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minimum_order_qty"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>MOQ</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lead_time_days"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead Time (Days)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="is_primary"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Primary Vendor
                                        </FormLabel>
                                        <FormDescription>
                                            Set this vendor as the default source for this product.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Link Product
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
