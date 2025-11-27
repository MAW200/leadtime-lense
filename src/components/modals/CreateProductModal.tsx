import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { MasterProduct } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const masterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
});

const variantSchema = z.object({
    master_product_id: z.string().min(1, 'Master product is required'),
    product_name: z.string().min(2, 'Variant name is required'),
    sku: z.string().min(2, 'SKU is required'),
    unit_cost: z.coerce.number().min(0, 'Cost must be positive'),
    safety_stock: z.coerce.number().min(0, 'Safety stock must be positive'),
});

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create_master' | 'add_variant';
    preSelectedMasterId?: string;
}

export const CreateProductModal = ({
    isOpen,
    onClose,
    mode,
    preSelectedMasterId,
}: CreateProductModalProps) => {
    const queryClient = useQueryClient();
    const [masters, setMasters] = useState<MasterProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const masterForm = useForm<z.infer<typeof masterSchema>>({
        resolver: zodResolver(masterSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    const variantForm = useForm<z.infer<typeof variantSchema>>({
        resolver: zodResolver(variantSchema),
        defaultValues: {
            master_product_id: preSelectedMasterId || '',
            product_name: '',
            sku: '',
            unit_cost: 0,
            safety_stock: 0,
        },
    });

    useEffect(() => {
        if (isOpen && mode === 'add_variant') {
            loadMasters();
            if (preSelectedMasterId) {
                variantForm.setValue('master_product_id', preSelectedMasterId);
            }
        }
    }, [isOpen, mode, preSelectedMasterId]);

    const loadMasters = async () => {
        try {
            const data = await api.inventory.getMasters();
            setMasters(data);
        } catch (error) {
            console.error('Failed to load masters', error);
            toast.error('Failed to load master products');
        }
    };

    const onMasterSubmit = async (values: z.infer<typeof masterSchema>) => {
        setIsLoading(true);
        try {
            // Uniqueness check (client-side for now, ideally DB constraint)
            const existing = await api.inventory.getMasters();
            if (existing.some((m) => m.name.toLowerCase() === values.name.toLowerCase())) {
                toast.error('A master product with this name already exists');
                setIsLoading(false);
                return;
            }

            await api.inventory.createMaster(values);
            toast.success('Master product created successfully');
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            onClose();
            masterForm.reset();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create master product');
        } finally {
            setIsLoading(false);
        }
    };

    const onVariantSubmit = async (values: z.infer<typeof variantSchema>) => {
        setIsLoading(true);
        try {
            await api.inventory.createVariant({
                ...values,
                in_stock: 0, // Default to 0
                allocated: 0,
                projected_stock: 0,
                consumed_30d: 0,
                on_order_local_14d: 0,
                on_order_shipment_a_60d: 0,
                on_order_shipment_b_60d: 0,
                signed_quotations: 0,
            });
            toast.success('Variant created successfully');
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            onClose();
            variantForm.reset();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create variant');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create_master' ? 'Create Master Product' : 'Add Product Variant'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create_master'
                            ? 'Create a new top-level product category. You can add variants to it later.'
                            : 'Add a specific variant (e.g., Size, Color) to an existing master product.'}
                    </DialogDescription>
                </DialogHeader>

                {mode === 'create_master' ? (
                    <Form {...masterForm}>
                        <form onSubmit={masterForm.handleSubmit(onMasterSubmit)} className="space-y-4">
                            <FormField
                                control={masterForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Master Product Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Nippon Paint" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={masterForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Optional description..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create Master Product'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                ) : (
                    <Form {...variantForm}>
                        <form onSubmit={variantForm.handleSubmit(onVariantSubmit)} className="space-y-4">
                            <FormField
                                control={variantForm.control}
                                name="master_product_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Master Product</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={!!preSelectedMasterId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a master product" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {masters.map((m) => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.name}
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
                                    control={variantForm.control}
                                    name="product_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Variant Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. White - 5L" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={variantForm.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. NP-WHT-5L" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={variantForm.control}
                                    name="unit_cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Cost ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={variantForm.control}
                                    name="safety_stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Safety Stock</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create Variant'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
};
