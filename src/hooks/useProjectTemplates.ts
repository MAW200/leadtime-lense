import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProjectTemplate, ProjectTemplateItem, ProjectTemplateWithItems } from '@/lib/supabase';

export const useProjectTemplates = () => {
  return useQuery({
    queryKey: ['project-templates'],
    queryFn: () => api.projectTemplates.getAll(),
  });
};

export const useProjectTemplate = (templateId?: string) => {
  return useQuery({
    queryKey: ['project-template', templateId],
    enabled: !!templateId,
    queryFn: () => api.projectTemplates.getById(templateId!),
  });
};

type BaseTemplatePayload = Pick<ProjectTemplate, 'name'> & Partial<Pick<ProjectTemplate, 'description' | 'is_active'>>;

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BaseTemplatePayload & { items?: Array<Pick<ProjectTemplateItem, 'product_id' | 'phase' | 'required_quantity'>> }) => {
      const template = await api.projectTemplates.create({
        name: payload.name,
        description: payload.description,
        is_active: payload.is_active,
      });

      if (payload.items && payload.items.length > 0) {
        for (const item of payload.items) {
          await api.projectTemplates.addItem(template.id, {
            product_id: item.product_id,
            phase: item.phase,
            required_quantity: item.required_quantity,
          });
        }
      }

      return template.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & BaseTemplatePayload) => {
      return api.projectTemplates.update(id, {
        name: updates.name,
        description: updates.description,
        is_active: updates.is_active,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      queryClient.invalidateQueries({ queryKey: ['project-template', variables.id] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.projectTemplates.delete(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      queryClient.invalidateQueries({ queryKey: ['project-template', id] });
    },
  });
};

export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: ProjectTemplateWithItems) => {
      const newTemplate = await api.projectTemplates.create({
        name: `${template.name} Copy`,
        description: template.description,
        is_active: template.is_active,
      });

      if (template.project_template_items && template.project_template_items.length > 0) {
        for (const item of template.project_template_items) {
          await api.projectTemplates.addItem(newTemplate.id, {
            product_id: item.product_id,
            phase: item.phase,
            required_quantity: item.required_quantity,
          });
        }
      }

      return newTemplate.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    },
  });
};

export const useTemplateItems = (templateId?: string) => {
  return useQuery({
    queryKey: ['project-template-items', templateId],
    enabled: !!templateId,
    queryFn: async () => {
      if (!templateId) return [];
      const template = await api.projectTemplates.getById(templateId);
      return template?.project_template_items || [];
    },
  });
};

export const useCreateTemplateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { template_id: string; product_id: string; phase: ProjectTemplateItem['phase']; required_quantity: number }) => {
      return api.projectTemplates.addItem(payload.template_id, {
        product_id: payload.product_id,
        phase: payload.phase,
        required_quantity: payload.required_quantity,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      queryClient.invalidateQueries({ queryKey: ['project-template', variables.template_id] });
      queryClient.invalidateQueries({ queryKey: ['project-template-items', variables.template_id] });
    },
  });
};

export const useUpdateTemplateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, template_id, ...updates }: { id: string; template_id: string; required_quantity: number; phase: ProjectTemplateItem['phase'] }) => {
      return api.projectTemplates.updateItem(template_id, id, {
        required_quantity: updates.required_quantity,
        phase: updates.phase,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      queryClient.invalidateQueries({ queryKey: ['project-template', variables.template_id] });
      queryClient.invalidateQueries({ queryKey: ['project-template-items', variables.template_id] });
    },
  });
};

export const useDeleteTemplateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, template_id }: { id: string; template_id: string }) => {
      return api.projectTemplates.deleteItem(template_id, id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      queryClient.invalidateQueries({ queryKey: ['project-template', variables.template_id] });
      queryClient.invalidateQueries({ queryKey: ['project-template-items', variables.template_id] });
    },
  });
};

