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
import { toast } from 'sonner';

// Email regex matching the database constraint: ^.+@.+\..+$
const emailRegex = /^.+@.+\..+$/;

const vendorFormSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    contact_email: z
        .string()
        .refine((val) => val === '' || emailRegex.test(val), {
            message: 'Invalid email format',
        })
        .optional()
        .or(z.literal('')),
    payment_terms: z.string().default('Net30'),
    tax_id: z.string().optional().or(z.literal('')),
    currency: z.string().default('USD'),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

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
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
];

interface VendorFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VendorForm = ({ isOpen, onClose }: VendorFormProps) => {
    const queryClient = useQueryClient();

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorFormSchema),
        defaultValues: {
            name: '',
            contact_email: '',
            payment_terms: 'Net30',
            tax_id: '',
            currency: 'USD',
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: VendorFormValues) =>
            api.vendors.create({
                name: values.name,
                contact_email: values.contact_email || '',
                payment_terms: values.payment_terms,
                tax_id: values.tax_id || null,
                currency: values.currency,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast.success('Vendor created successfully');
            handleClose();
        },
        onError: (error: Error) => {
            console.error('Failed to create vendor:', error);
            if (error.message?.includes('vendors_name_key')) {
                toast.error('A vendor with this name already exists.');
                form.setError('name', { message: 'Vendor name must be unique' });
            } else if (error.message?.includes('vendors_contact_email_format')) {
                toast.error('Invalid email format');
                form.setError('contact_email', { message: 'Email must match format: example@domain.com' });
            } else {
                toast.error('Failed to create vendor. Please try again.');
            }
        },
    });

    const handleClose = () => {
        form.reset();
        onClose();
    };

    const onSubmit = (values: VendorFormValues) => {
        createMutation.mutate(values);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Vendor</DialogTitle>
                    <DialogDescription>
                        Add a new supplier to your vendor master list.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        {/* Vendor Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Vendor Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Supplies Inc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Contact Email */}
                        <FormField
                            control={form.control}
                            name="contact_email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="contact@acme.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Primary contact email for this vendor
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Payment Terms and Currency Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="payment_terms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Terms</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
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
                                            defaultValue={field.value}
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

                        {/* Tax ID */}
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

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Vendor'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

