-- Update proposals table to remove proposal_type and created_by columns
ALTER TABLE proposals DROP COLUMN IF EXISTS proposal_type;
ALTER TABLE proposals DROP COLUMN IF EXISTS created_by;

-- Update the constraint to remove proposal_type check
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS valid_proposal_type;

-- Update the status history constraint to remove proposal_type references
ALTER TABLE proposal_status_history DROP CONSTRAINT IF EXISTS valid_proposal_history_status;
ALTER TABLE proposal_status_history ADD CONSTRAINT valid_proposal_history_status CHECK (
    old_status IN ('Draft', 'Submitted', 'Under Review', 'Presented to Working Group', 'Presented to Ministry', 'Approved', 'Rejected') AND 
    new_status IN ('Draft', 'Submitted', 'Under Review', 'Presented to Working Group', 'Presented to Ministry', 'Approved', 'Rejected')
); 