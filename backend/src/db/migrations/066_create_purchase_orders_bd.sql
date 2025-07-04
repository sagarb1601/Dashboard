-- Create purchase_orders_bd table
CREATE TABLE IF NOT EXISTS purchase_orders_bd (
    po_id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    invoice_no VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_value DECIMAL(15,2) NOT NULL CHECK (invoice_value >= 0),
    payment_duration VARCHAR(50) CHECK (payment_duration IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time')),
    invoice_status VARCHAR(50) NOT NULL CHECK (invoice_status IN ('Pending', 'Approved', 'Rejected', 'Paid')),
    requested_by INTEGER REFERENCES hr_employees(employee_id) ON DELETE SET NULL,
    payment_mode VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_purchase_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to purchase_orders_bd
DROP TRIGGER IF EXISTS update_purchase_orders_timestamp ON purchase_orders_bd;
CREATE TRIGGER update_purchase_orders_timestamp
    BEFORE UPDATE ON purchase_orders_bd
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_orders_timestamp();

-- Add indexes for better performance
CREATE INDEX idx_purchase_orders_entity ON purchase_orders_bd(entity_id);
CREATE INDEX idx_purchase_orders_requested_by ON purchase_orders_bd(requested_by);
CREATE INDEX idx_purchase_orders_invoice_date ON purchase_orders_bd(invoice_date); 