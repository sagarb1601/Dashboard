-- Drop existing products table
DROP TABLE IF EXISTS products CASCADE;

-- Create products table with proper structure
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES business_entities(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL CHECK (price >= 0),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_entity FOREIGN KEY (entity_id) 
        REFERENCES business_entities(id) ON DELETE CASCADE
); 