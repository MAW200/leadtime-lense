-- Add unique constraint to vendors name
ALTER TABLE vendors ADD CONSTRAINT vendors_name_key UNIQUE (name);
