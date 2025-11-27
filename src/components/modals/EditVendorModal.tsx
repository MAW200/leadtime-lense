import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    FormDescription,
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
import { api } from '@/lib/api';
import { Vendor } from '@/lib/supabase';
import { toast } from 'sonner';

// Email regex matching the database constraint: ^.+@.+\..+$
const emailRegex = /^.+@.+\..+$/;

const vendorSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    contact_email: z
        .string()
        .min(1, 'Email is required')
        .refine((val) => emailRegex.test(val), {
            message: 'Invalid email format',
        }),
    payment_terms: z.string().default('Net30'),
    currency: z.string().default('USD'),
    tax_id: z.string().optional().or(z.literal('')),
});

// Common payment terms options
const PAYMENT_TERMS_OPTIONS = [
    { value: 'Net15', label: 'Net 15' },
    { value: 'Net30', label: 'Net 30' },
    { value: 'Net45', label: 'Net 45' },
    { value: 'Net60', label: 'Net 60' },
    { value: 'Net90', label: 'Net 90' },
    { value: 'Due on Receipt', label: 'Due on Receipt' },
    { value: 'Prepaid', label: 'Prepaid' },
];

// Common currency options
const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
];

interface EditVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: Vendor;
}

export const EditVendorModal = ({ isOpen, onClose, vendor }: EditVendorModalProps) => {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof vendorSchema>>({
        resolver: zodResolver(vendorSchema),
        defaultValues: {
            name: vendor.name,
            contact_email: vendor.contact_email || '',
            payment_terms: vendor.payment_terms || 'Net30',
            currency: vendor.currency || 'USD',
            tax_id: vendor.tax_id || '',
        },
    });

    // Reset form when vendor changes
    useEffect(() => {
        if (vendor) {
            form.reset({
                name: vendor.name,
                contact_email: vendor.contact_email || '',
                payment_terms: vendor.payment_terms || 'Net30',
                currency: vendor.currency || 'USD',
                tax_id: vendor.tax_id || '',
            });
        }
    }, [vendor, form]);

    const updateMutation = useMutation({
        mutationFn: (values: z.infer<typeof vendorSchema>) =>
            api.vendors.update(vendor.id, {
                name: values.name,
                contact_email: values.contact_email,
                payment_terms: values.payment_terms,
                currency: values.currency,
                tax_id: values.tax_id || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', vendor.id] });
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast.success('Vendor updated successfully');
            onClose();
        },
        onError: (error: Error) => {
            console.error(error);
            if (error.message?.includes('vendors_contact_email_format')) {
                toast.error('Invalid email format');
                form.setError('contact_email', { message: 'Email must match format: example@domain.com' });
            } else {
                toast.error('Failed to update vendor');
            }
        },
    });

    const onSubmit = (values: z.infer<typeof vendorSchema>) => {
        updateMutation.mutate(values);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Vendor</DialogTitle>
                    <DialogDescription>
                        Update supplier details.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Vendor Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contact_email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Contact Email <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Primary contact email for this vendor
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="payment_terms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Terms</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select terms" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PAYMENT_TERMS_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
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
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CURRENCY_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="tax_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tax ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="XX-XXXXXXX" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Vendor's tax identification number (EIN, VAT, etc.)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
