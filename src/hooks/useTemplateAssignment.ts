import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export const useAssignTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, templateId }: { projectId: string; templateId: string }) =>
            api.projects.assignTemplate(projectId, templateId),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
            toast.success('Template assigned successfully');
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.message || 'Failed to assign template');
        },
    });
};
