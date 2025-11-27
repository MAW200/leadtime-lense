import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Building2, Search, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Validation schema
const createPOSchema = z.object({
    vendor_id: z.string().uuid('Please select a valid vendor'),
    expected_delivery: z.date().optional(),
});

type CreatePOFormValues = z.infer<typeof createPOSchema>;

interface CreatePOProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreatePO = ({ isOpen, onClose }: CreatePOProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [vendorSearchOpen, setVendorSearchOpen] = useState(false);

    // Fetch vendors for dropdown
    const { data: vendors, isLoading: vendorsLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: api.vendors.getAll,
    });

    const form = useForm<CreatePOFormValues>({
        resolver: zodResolver(createPOSchema),
        defaultValues: {
            vendor_id: '',
            expected_delivery: undefined,
        },
    });

    // Create PO mutation
    const createPOMutation = useMutation({
        mutationFn: async (values: CreatePOFormValues) => {
            // Only send vendor_id and expected_delivery
            // DO NOT send po_number (auto-generated) or status (defaults to 'draft')
            const payload: {
                vendor_id: string;
                expected_delivery?: string;
            } = {
                vendor_id: values.vendor_id,
            };

            if (values.expected_delivery) {
                payload.expected_delivery = format(values.expected_delivery, 'yyyy-MM-dd');
            }

            return api.purchaseOrders.create(payload);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success(`Purchase Order PO-${data.po_number} created successfully`);
            handleClose();
            // Redirect to PO detail page
            navigate(`/purchase-orders/${data.id}`);
        },
        onError: (error: Error) => {
            console.error('Failed to create PO:', error);
            toast.error('Failed to create purchase order. Please try again.');
        },
    });

    const handleClose = () => {
        form.reset();
        onClose();
    };

    const onSubmit = (values: CreatePOFormValues) => {
        createPOMutation.mutate(values);
    };

    // Get selected vendor for display
    const selectedVendor = vendors?.find((v) => v.id === form.watch('vendor_id'));

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Create Purchase Order</DialogTitle>
                            <DialogDescription>
                                Step 1: Select vendor and delivery date
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Vendor Selection */}
                        <FormField
                            control={form.control}
                            name="vendor_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>
                                        Vendor <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Popover open={vendorSearchOpen} onOpenChange={setVendorSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={vendorSearchOpen}
                                                    className={cn(
                                                        'w-full justify-between',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4" />
                                                            {selectedVendor?.name}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Search className="h-4 w-4" />
                                                            Search vendors...
                                                        </div>
                                                    )}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search vendors by name..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {vendorsLoading ? 'Loading vendors...' : 'No vendors found.'}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {vendors?.map((vendor) => (
                                                            <CommandItem
                                                                key={vendor.id}
                                                                value={vendor.name}
                                                                onSelect={() => {
                                                                    form.setValue('vendor_id', vendor.id);
                                                                    setVendorSearchOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                                        <Building2 className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium truncate">
                                                                            {vendor.name}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground truncate">
                                                                            {vendor.contact_email || 'No email'}
                                                                            {vendor.payment_terms && ` • ${vendor.payment_terms}`}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-xs font-mono text-muted-foreground">
                                                                        {vendor.currency || 'USD'}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Select the supplier for this purchase order
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Selected Vendor Info Card */}
                        {selectedVendor && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{selectedVendor.name}</p>
                                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                            <p>{selectedVendor.contact_email}</p>
                                            <div className="flex gap-4">
                                                <span>
                                                    Terms: <strong>{selectedVendor.payment_terms || 'Net30'}</strong>
                                                </span>
                                                <span>
                                                    Currency: <strong>{selectedVendor.currency || 'USD'}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expected Delivery Date */}
                        <FormField
                            control={form.control}
                            name="expected_delivery"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Expected Delivery Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'PPP')
                                                    ) : (
                                                        <span>Select expected delivery date</span>
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
                                                disabled={(date) => date < new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        When do you expect to receive this order?
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={createPOMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createPOMutation.isPending || !form.watch('vendor_id')}
                            >
                                {createPOMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Draft'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePO;


