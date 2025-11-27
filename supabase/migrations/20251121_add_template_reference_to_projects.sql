-- Add template reference to projects table
ALTER TABLE projects 
ADD COLUMN template_id uuid REFERENCES project_templates(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_template_id 
ON projects(template_id);

-- Add comment for documentation
COMMENT ON COLUMN projects.template_id IS 'Reference to the project template used to populate this project materials';
