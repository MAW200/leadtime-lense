import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Search, Mail, Building2, CreditCard, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
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
import { TopHeader } from '@/components/navigation/TopHeader';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

const Vendors = () => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { isPurchaser, isAdmin } = useRole();
    
    // Only Purchasers and Admins can create/edit vendors
    const canManageVendors = isPurchaser || isAdmin;

    const { data: vendors, isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: api.vendors.getAll,
    });

    const form = useForm<z.infer<typeof vendorSchema>>({
        resolver: zodResolver(vendorSchema),
        defaultValues: {
            name: '',
            contact_email: '',
            payment_terms: 'Net30',
            currency: 'USD',
            tax_id: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: z.infer<typeof vendorSchema>) =>
            api.vendors.create({
                name: values.name,
                contact_email: values.contact_email,
                payment_terms: values.payment_terms,
                currency: values.currency,
                tax_id: values.tax_id || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setIsCreateOpen(false);
            form.reset();
            toast.success('Vendor created successfully');
        },
        onError: (error: Error) => {
            console.error(error);
            if (error.message?.includes('vendors_name_key')) {
                toast.error('A vendor with this name already exists.');
                form.setError('name', { message: 'Vendor name must be unique' });
            } else if (error.message?.includes('vendors_contact_email_format')) {
                toast.error('Invalid email format');
                form.setError('contact_email', { message: 'Email must match format: example@domain.com' });
            } else {
                toast.error('Failed to create vendor');
            }
        },
    });

    const onSubmit = (values: z.infer<typeof vendorSchema>) => {
        createMutation.mutate(values);
    };

    const filteredVendors = vendors?.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            <TopHeader
                title="Vendors"
                description="Manage your suppliers and procurement partners"
                actions={
                    canManageVendors ? (
                        <Button onClick={() => setIsCreateOpen(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Vendor
                        </Button>
                    ) : undefined
                }
            />

            <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="flex items-center mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-40 w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredVendors?.map((vendor) => (
                            <div
                                key={vendor.id}
                                className="group relative bg-card border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                                onClick={() => navigate(`/vendors/${vendor.id}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                {vendor.name}
                                            </h3>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <DollarSign className="h-3 w-3 mr-1" />
                                                {vendor.currency || 'USD'}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {vendor.payment_terms || 'Net30'}
                                    </Badge>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {vendor.contact_email || 'No email'}
                                    </div>
                                    {vendor.tax_id && (
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Tax ID: {vendor.tax_id}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Created</span>
                                    <span className="font-medium">
                                        {new Date(vendor.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Vendor</DialogTitle>
                        <DialogDescription>
                            Enter the details of the new supplier.
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
                                            <Input placeholder="Acme Supplies Inc." {...field} />
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
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
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
        </div>
    );
};

export default Vendors;
