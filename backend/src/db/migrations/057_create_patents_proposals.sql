-- Create patents table
CREATE TABLE IF NOT EXISTS patents (
    patent_id SERIAL PRIMARY KEY,
    patent_title VARCHAR(255) NOT NULL,
    filing_date DATE NOT NULL,
    application_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Filed',
    status_update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    grant_date DATE,
    rejection_date DATE,
    rejection_reason TEXT,
    remarks TEXT,
    group_id INTEGER NOT NULL REFERENCES technical_groups(group_id),
    created_by INTEGER NOT NULL REFERENCES hr_employees(employee_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_patent_status CHECK (status IN ('Filed', 'Under Review', 'Granted', 'Rejected'))
);

-- Create patent inventors junction table
CREATE TABLE IF NOT EXISTS patent_inventors (
    patent_id INTEGER NOT NULL REFERENCES patents(patent_id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(employee_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (patent_id, employee_id)
);

-- Create patent status history table
CREATE TABLE IF NOT EXISTS patent_status_history (
    history_id SERIAL PRIMARY KEY,
    patent_id INTEGER NOT NULL REFERENCES patents(patent_id) ON DELETE CASCADE,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NOT NULL REFERENCES hr_employees(employee_id),
    remarks TEXT,
    CONSTRAINT valid_patent_history_status CHECK (old_status IN ('Filed', 'Under Review', 'Granted', 'Rejected') AND new_status IN ('Filed', 'Under Review', 'Granted', 'Rejected'))
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
    proposal_id SERIAL PRIMARY KEY,
    proposal_title VARCHAR(255) NOT NULL,
    proposal_type VARCHAR(50) NOT NULL,
    submitted_by INTEGER NOT NULL REFERENCES hr_employees(employee_id),
    submission_date DATE NOT NULL,
    funding_agency VARCHAR(100) NOT NULL,
    proposed_budget DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    status_update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approval_date DATE,
    rejection_date DATE,
    rejection_reason TEXT,
    remarks TEXT,
    group_id INTEGER NOT NULL REFERENCES technical_groups(group_id),
    created_by INTEGER NOT NULL REFERENCES hr_employees(employee_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_proposal_type CHECK (proposal_type IN ('MIETY', 'DST', 'Other')),
    CONSTRAINT valid_proposal_status CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Presented to Working Group', 'Presented to Ministry', 'Approved', 'Rejected'))
);

-- Create proposal status history table
CREATE TABLE IF NOT EXISTS proposal_status_history (
    history_id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NOT NULL REFERENCES hr_employees(employee_id),
    remarks TEXT,
    CONSTRAINT valid_proposal_history_status CHECK (
        old_status IN ('Draft', 'Submitted', 'Under Review', 'Presented to Working Group', 'Presented to Ministry', 'Approved', 'Rejected') AND 
        new_status IN ('Draft', 'Submitted', 'Under Review', 'Presented to Working Group', 'Presented to Ministry', 'Approved', 'Rejected')
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_patents_group_id ON patents(group_id);
CREATE INDEX idx_patents_status ON patents(status);
CREATE INDEX idx_patents_filing_date ON patents(filing_date);
CREATE INDEX idx_patent_inventors_patent_id ON patent_inventors(patent_id);
CREATE INDEX idx_patent_inventors_employee_id ON patent_inventors(employee_id);
CREATE INDEX idx_patent_history_patent_id ON patent_status_history(patent_id);
CREATE INDEX idx_patent_history_update_date ON patent_status_history(update_date);

CREATE INDEX idx_proposals_group_id ON proposals(group_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_submission_date ON proposals(submission_date);
CREATE INDEX idx_proposals_funding_agency ON proposals(funding_agency);
CREATE INDEX idx_proposal_history_proposal_id ON proposal_status_history(proposal_id);
CREATE INDEX idx_proposal_history_update_date ON proposal_status_history(update_date);

-- Create triggers to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patents_updated_at
    BEFORE UPDATE ON patents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables and columns for better documentation
COMMENT ON TABLE patents IS 'Stores patent information and their current status';
COMMENT ON TABLE patent_inventors IS 'Junction table linking patents with their inventors (employees)';
COMMENT ON TABLE patent_status_history IS 'Tracks the history of status changes for patents';
COMMENT ON TABLE proposals IS 'Stores proposal information and their current status';
COMMENT ON TABLE proposal_status_history IS 'Tracks the history of status changes for proposals';

COMMENT ON COLUMN patents.patent_id IS 'Unique identifier for each patent';
COMMENT ON COLUMN patents.patent_title IS 'Title of the patent';
COMMENT ON COLUMN patents.filing_date IS 'Date when the patent was filed';
COMMENT ON COLUMN patents.application_number IS 'Patent application number';
COMMENT ON COLUMN patents.status IS 'Current status of the patent (Filed, Under Review, Granted, Rejected)';
COMMENT ON COLUMN patents.status_update_date IS 'Date when the status was last updated';
COMMENT ON COLUMN patents.grant_date IS 'Date when the patent was granted (if applicable)';
COMMENT ON COLUMN patents.rejection_date IS 'Date when the patent was rejected (if applicable)';
COMMENT ON COLUMN patents.rejection_reason IS 'Reason for rejection (if applicable)';
COMMENT ON COLUMN patents.remarks IS 'Additional remarks or notes about the patent';
COMMENT ON COLUMN patents.group_id IS 'Reference to the technical group responsible for the patent';
COMMENT ON COLUMN patents.created_by IS 'Employee who created the patent record';
COMMENT ON COLUMN patents.created_at IS 'Timestamp when the patent record was created';
COMMENT ON COLUMN patents.updated_at IS 'Timestamp when the patent record was last updated';

COMMENT ON COLUMN patent_inventors.patent_id IS 'Reference to the patent';
COMMENT ON COLUMN patent_inventors.employee_id IS 'Reference to the employee who is an inventor';
COMMENT ON COLUMN patent_inventors.created_at IS 'Timestamp when the inventor was added';

COMMENT ON COLUMN proposals.proposal_id IS 'Unique identifier for each proposal';
COMMENT ON COLUMN proposals.proposal_title IS 'Title of the proposal';
COMMENT ON COLUMN proposals.proposal_type IS 'Type of proposal (MIETY, DST, Other)';
COMMENT ON COLUMN proposals.submitted_by IS 'Employee who submitted the proposal';
COMMENT ON COLUMN proposals.submission_date IS 'Date when the proposal was submitted';
COMMENT ON COLUMN proposals.funding_agency IS 'Name of the funding agency';
COMMENT ON COLUMN proposals.proposed_budget IS 'Budget amount proposed in the proposal';
COMMENT ON COLUMN proposals.status IS 'Current status of the proposal (Draft, Submitted, Under Review, etc.)';
COMMENT ON COLUMN proposals.status_update_date IS 'Date when the status was last updated';
COMMENT ON COLUMN proposals.approval_date IS 'Date when the proposal was approved (if applicable)';
COMMENT ON COLUMN proposals.rejection_date IS 'Date when the proposal was rejected (if applicable)';
COMMENT ON COLUMN proposals.rejection_reason IS 'Reason for rejection (if applicable)';
COMMENT ON COLUMN proposals.remarks IS 'Additional remarks or notes about the proposal';
COMMENT ON COLUMN proposals.group_id IS 'Reference to the technical group responsible for the proposal';
COMMENT ON COLUMN proposals.created_by IS 'Employee who created the proposal record';
COMMENT ON COLUMN proposals.created_at IS 'Timestamp when the proposal record was created';
COMMENT ON COLUMN proposals.updated_at IS 'Timestamp when the proposal record was last updated'; 