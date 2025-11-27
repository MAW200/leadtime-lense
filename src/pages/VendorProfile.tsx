import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, Building2, Package, FileText, CreditCard, DollarSign, Pencil, Link as LinkIcon } from 'lucide-react';
import { TopHeader } from '@/components/navigation/TopHeader';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LinkProductModal } from '@/components/modals/LinkProductModal';
import { EditVendorModal } from '@/components/modals/EditVendorModal';
import { useRole } from '@/contexts/RoleContext';
import { useState } from 'react';

const VendorProfile = () => {
    const { id } = useParams<{ id: string }>();
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { isPurchaser, isAdmin } = useRole();
    
    // Only Purchasers and Admins can edit vendors
    const canManageVendors = isPurchaser || isAdmin;

    const { data: vendor, isLoading: isVendorLoading } = useQuery({
        queryKey: ['vendor', id],
        queryFn: () => api.vendors.getById(id!),
        enabled: !!id,
    });

    const { data: vendorProducts, isLoading: isProductsLoading } = useQuery({
        queryKey: ['vendor-products', id],
        queryFn: () => api.vendors.getProducts(id!),
        enabled: !!id,
    });

    const { data: purchaseOrders, isLoading: isPOsLoading } = useQuery({
        queryKey: ['vendor-pos', id],
        queryFn: () => api.purchaseOrders.getAll('all', id),
        enabled: !!id,
    });

    if (isVendorLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!vendor) return <div>Vendor not found</div>;

    return (
        <div className="h-full flex flex-col">
            <TopHeader
                title={vendor.name}
                description="Vendor Details and History"
                actions={
                    <div className="flex gap-2">
                        {canManageVendors && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Vendor
                            </Button>
                        )}
                        <Badge variant="outline" className="font-mono">
                            {vendor.payment_terms || 'Net30'}
                        </Badge>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto px-8 py-6">
                {/* Header Stats */}
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Currency</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vendor.currency || 'USD'}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vendorProducts?.length || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{purchaseOrders?.length || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Payment Terms</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vendor.payment_terms || 'Net30'}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Info */}
                <div className="bg-card border rounded-lg p-6 mb-8">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Contact Information
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Email</p>
                                <p className="text-muted-foreground">{vendor.contact_email || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Tax ID</p>
                                <p className="text-muted-foreground">{vendor.tax_id || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Currency</p>
                                <p className="text-muted-foreground">{vendor.currency || 'USD'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="products" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="products">Linked Products</TabsTrigger>
                        <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products">
                        {canManageVendors && (
                            <div className="flex justify-end mb-4">
                                <Button size="sm" onClick={() => setIsLinkModalOpen(true)}>
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    Link Product
                                </Button>
                            </div>
                        )}
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Vendor SKU</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>MOQ</TableHead>
                                        <TableHead>Lead Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isProductsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                Loading products...
                                            </TableCell>
                                        </TableRow>
                                    ) : vendorProducts?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No products linked to this vendor
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        vendorProducts?.map((vp: any) => (
                                            <TableRow key={vp.id}>
                                                <TableCell className="font-medium">
                                                    {vp.product?.product_name}
                                                </TableCell>
                                                <TableCell>{vp.vendor_sku || '-'}</TableCell>
                                                <TableCell>${vp.unit_price.toFixed(2)}</TableCell>
                                                <TableCell>{vp.minimum_order_qty}</TableCell>
                                                <TableCell>{vp.lead_time_days} Days</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="orders">
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Expected Delivery</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isPOsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                Loading orders...
                                            </TableCell>
                                        </TableRow>
                                    ) : purchaseOrders?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No purchase orders found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        purchaseOrders?.map((po) => (
                                            <TableRow key={po.id}>
                                                <TableCell className="font-medium">{po.po_number}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {po.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {po.order_date ? new Date(po.order_date).toLocaleDateString() : '-'}
                                                </TableCell>
                                                <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {po.expected_delivery_date
                                                        ? new Date(po.expected_delivery_date).toLocaleDateString()
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <LinkProductModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                vendorId={vendor.id}
                vendorLeadTime={14}
            />

            <EditVendorModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                vendor={vendor}
            />
        </div>
    );
};

export default VendorProfile;
