import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useProjectMaterials } from '@/hooks/useProjectMaterials';

const OnsiteProjectBOM = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    P1: true,
    P2a: false,
    P2b: false,
  });

  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: materials, isLoading: materialsLoading } = useProjectMaterials(id);

  const togglePhase = (phase: string) => {
    setOpenPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  const getPhaseTitle = (phase: string) => {
    const titles: Record<string, string> = {
      P1: 'Phase 1 (P1)',
      P2a: 'Phase 2a (P2a)',
      P2b: 'Phase 2b (P2b)',
    };
    return titles[phase] || phase;
  };

  const getPhaseMaterials = (phase: string) => {
    return materials?.filter((m) => m.phase === phase) || [];
  };

  if (projectLoading || materialsLoading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader />
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader title="Project Not Found" />
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/onsite/projects')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const phases = ['P1', 'P2a', 'P2b'];
  const hasAnyMaterials = materials && materials.length > 0;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={project.name}
        description="Bill of Materials"
        actions={
          <Button variant="outline" onClick={() => navigate('/onsite/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {hasAnyMaterials ? (
          <div className="space-y-4">
            {phases.map((phase) => {
              const phaseMaterials = getPhaseMaterials(phase);
              if (phaseMaterials.length === 0) return null;

              return (
                <Collapsible
                  key={phase}
                  open={openPhases[phase]}
                  onOpenChange={() => togglePhase(phase)}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {openPhases[phase] ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                            <CardTitle className="text-lg">{getPhaseTitle(phase)}</CardTitle>
                            <Badge variant="secondary">{phaseMaterials.length} items</Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Product Name</TableHead>
                                <TableHead className="font-semibold">SKU</TableHead>
                                <TableHead className="font-semibold text-right">
                                  Required Qty
                                </TableHead>
                                <TableHead className="font-semibold text-right">
                                  Claimed Qty
                                </TableHead>
                                <TableHead className="font-semibold text-right">
                                  Remaining Qty
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {phaseMaterials.map((material) => {
                                const remaining =
                                  material.required_quantity - material.claimed_quantity;
                                const isFullyClaimed = remaining <= 0;

                                return (
                                  <TableRow
                                    key={material.id}
                                    className={isFullyClaimed ? 'opacity-50' : ''}
                                  >
                                    <TableCell className="font-medium">
                                      {material.product?.product_name || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {material.product?.sku || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {material.required_quantity}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {material.claimed_quantity}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge
                                        variant={isFullyClaimed ? 'secondary' : 'default'}
                                        className={
                                          isFullyClaimed
                                            ? ''
                                            : 'bg-green-500 hover:bg-green-600'
                                        }
                                      >
                                        {remaining}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No materials assigned</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              This project doesn't have any materials in its Bill of Materials yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnsiteProjectBOM;
