-- Migration 082: Fix procurement fields to use existing structure properly

-- Remove the unique constraint on indent_number to allow manual entry
ALTER TABLE procurements DROP CONSTRAINT IF EXISTS procurements_indent_number_key;

-- Make indent_date and mmg_acceptance_date NOT NULL for new records
ALTER TABLE procurements ALTER COLUMN indent_date SET NOT NULL;
ALTER TABLE procurements ALTER COLUMN mmg_acceptance_date SET NOT NULL;

-- Update existing records to have default values for the date fields
UPDATE procurements SET 
    indent_date = created_at::date,
    mmg_acceptance_date = created_at::date
WHERE indent_date IS NULL OR mmg_acceptance_date IS NULL; 