import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AllocatedProducts = ({ projectId }: { projectId: string }) => {
    const { data: materials, isLoading } = useQuery({
        queryKey: ['project-materials', projectId],
        queryFn: async () => {
            // Fetch allocated materials for the project
            return await api.projectMaterials.getByProject(projectId);
        },
        enabled: !!projectId,
    });

    if (isLoading) {
        return <div className="text-muted-foreground">Loading allocated products...</div>;
    }

    if (!materials || materials.length === 0) {
        return <div className="text-muted-foreground">No allocated products for this project.</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Allocated Products (Template Materials)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Product Name</TableHead>
                            <TableHead className="font-semibold">SKU</TableHead>
                            <TableHead className="font-semibold">Phase</TableHead>
                            <TableHead className="font-semibold">Required Qty</TableHead>
                            <TableHead className="font-semibold">Claimed Qty</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {materials.map((m) => (
                            <TableRow key={m.id}>
                                <TableCell className="font-medium">{m.product?.product_name || '-'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{m.product?.sku || '-'}</TableCell>
                                <TableCell className="text-sm">{m.phase || '-'}</TableCell>
                                <TableCell className="text-sm">{m.required_quantity}</TableCell>
                                <TableCell className="text-sm">{m.claimed_quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
