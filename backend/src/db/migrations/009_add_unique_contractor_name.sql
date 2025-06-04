-- Add unique constraint to contractor_company_name
ALTER TABLE admin_contractors
ADD CONSTRAINT unique_contractor_company_name UNIQUE (contractor_company_name); 