import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAssignTemplate } from '@/hooks/useTemplateAssignment';

interface AssignTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    existingTemplateId?: string;
    hasMaterials?: boolean;
}

export const AssignTemplateModal = ({
    isOpen,
    onClose,
    projectId,
    projectName,
    existingTemplateId,
    hasMaterials = false,
}: AssignTemplateModalProps) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    const { data: templates, isLoading: templatesLoading } = useQuery({
        queryKey: ['project-templates'],
        queryFn: api.projectTemplates.getAll,
        enabled: isOpen,
    });

    const { data: selectedTemplate } = useQuery({
        queryKey: ['project-template', selectedTemplateId],
        queryFn: () => api.projectTemplates.getById(selectedTemplateId),
        enabled: !!selectedTemplateId,
    });

    const assignMutation = useAssignTemplate();

    const handleAssign = () => {
        if (!selectedTemplateId) return;

        assignMutation.mutate(
            { projectId, templateId: selectedTemplateId },
            {
                onSuccess: () => {
                    onClose();
                    setSelectedTemplateId('');
                },
            }
        );
    };

    const handleClose = () => {
        setSelectedTemplateId('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {existingTemplateId ? 'Change Template' : 'Assign Template'}
                    </DialogTitle>
                    <DialogDescription>
                        Assign a project template to "{projectName}". The template's products will be
                        added to the project materials.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {hasMaterials && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                This project already has materials. Assigning a template will add new
                                materials. Consider clearing existing materials first.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Template</label>
                        <Select
                            value={selectedTemplateId}
                            onValueChange={setSelectedTemplateId}
                            disabled={templatesLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates?.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{template.name}</span>
                                            {template.is_active && (
                                                <Badge variant="outline" className="text-xs">
                                                    Active
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedTemplate && (
                        <div className="rounded-md border p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Package className="h-4 w-4" />
                                Template Preview
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <p>
                                    <strong>{selectedTemplate.project_template_items?.length || 0}</strong>{' '}
                                    products will be added to this project
                                </p>
                                {selectedTemplate.description && (
                                    <p className="mt-1">{selectedTemplate.description}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={assignMutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedTemplateId || assignMutation.isPending}
                    >
                        {assignMutation.isPending ? 'Assigning...' : 'Assign Template'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
