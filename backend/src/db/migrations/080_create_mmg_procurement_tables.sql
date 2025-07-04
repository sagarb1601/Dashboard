-- Migration 080: Create tables for the MMG Procurement Module

-- 1. Procurements (The Main Request)
CREATE TABLE procurements (
    id SERIAL PRIMARY KEY,
    indent_number VARCHAR(100) UNIQUE,
    title VARCHAR(255) NOT NULL,
    project_id INTEGER, -- Can be linked to finance_projects if needed
    indentor_id INTEGER REFERENCES hr_employees(employee_id),
    group_id INTEGER REFERENCES technical_groups(group_id),
    purchase_type VARCHAR(50) CHECK (purchase_type IN ('Consumables', 'Capital Equipment', 'Stock & Sale')),
    delivery_place VARCHAR(50) CHECK (delivery_place IN ('CDAC KP', 'CDAC EC1', 'CDAC EC2')),
    status VARCHAR(50) DEFAULT 'Pending Approval',
    estimated_cost DECIMAL(15,2),
    sourcing_method VARCHAR(20) CHECK (sourcing_method IN ('TENDER', 'GEM')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Procurement Items (What is being purchased)
CREATE TABLE procurement_items (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    specifications TEXT,
    quantity INTEGER NOT NULL
);

-- 3. Procurement History (The Timeline / Audit Trail)
CREATE TABLE procurement_history (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    remarks TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Procurement Bids (For Tender/Quotation based sourcing)
CREATE TABLE procurement_bids (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
    tender_number VARCHAR(100),
    bids_received_count INTEGER,
    finalized_vendor VARCHAR(255),
    notes TEXT
);

-- 5. Purchase Orders
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    po_date DATE NOT NULL,
    po_value DECIMAL(15,2) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_procurements_status ON procurements(status);
CREATE INDEX idx_procurements_indentor_id ON procurements(indentor_id);
CREATE INDEX idx_procurement_items_procurement_id ON procurement_items(procurement_id);
CREATE INDEX idx_procurement_history_procurement_id ON procurement_history(procurement_id);
CREATE INDEX idx_procurement_bids_procurement_id ON procurement_bids(procurement_id);
CREATE INDEX idx_purchase_orders_procurement_id ON purchase_orders(procurement_id); 