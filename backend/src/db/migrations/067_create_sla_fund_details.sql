-- Create SLA Fund Details table
CREATE TABLE sla_fund_details (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('Milestone', 'As per Terms and Conditions')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'paid')),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Create an index on agreement_id for faster lookups
CREATE INDEX idx_sla_fund_details_agreement_id ON sla_fund_details(agreement_id);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sla_fund_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sla_fund_details_timestamp
    BEFORE UPDATE ON sla_fund_details
    FOR EACH ROW
    EXECUTE FUNCTION update_sla_fund_details_updated_at();

-- Add a comment to the table
COMMENT ON TABLE sla_fund_details IS 'Stores payment details for SLA agreements';

-- Add comments to columns
COMMENT ON COLUMN sla_fund_details.id IS 'Primary key for the SLA fund detail';
COMMENT ON COLUMN sla_fund_details.agreement_id IS 'Foreign key reference to the agreements table';
COMMENT ON COLUMN sla_fund_details.payment_type IS 'Type of payment (Milestone or As per Terms and Conditions)';
COMMENT ON COLUMN sla_fund_details.amount IS 'Payment amount in the agreement currency';
COMMENT ON COLUMN sla_fund_details.payment_status IS 'Current status of the payment (pending or paid)';
COMMENT ON COLUMN sla_fund_details.comments IS 'Additional notes or comments about the payment';
COMMENT ON COLUMN sla_fund_details.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sla_fund_details.updated_at IS 'Timestamp when the record was last updated'; 