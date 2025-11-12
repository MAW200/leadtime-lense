import { TopHeader } from '@/components/TopHeader';
import { Button } from '@/components/ui/button';
import { Plus, FileStack } from 'lucide-react';

const ProjectTemplates = () => {
  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Project Templates"
        description="Manage reusable Bill of Materials templates for projects"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
          <FileStack className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Create your first project template to standardize Bill of Materials across similar projects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectTemplates;
