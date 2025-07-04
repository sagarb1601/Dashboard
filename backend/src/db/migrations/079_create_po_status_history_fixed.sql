-- Create PO status history table
CREATE TABLE IF NOT EXISTS po_status_history (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (po_id) REFERENCES purchase_orders_bd(po_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Add status column to purchase_orders_bd if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_orders_bd' AND column_name = 'status') THEN
        ALTER TABLE purchase_orders_bd ADD COLUMN status VARCHAR(50) DEFAULT 'Payment Pending';
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_po_status_history_po_id ON po_status_history(po_id);
CREATE INDEX IF NOT EXISTS idx_po_status_history_changed_at ON po_status_history(changed_at); 