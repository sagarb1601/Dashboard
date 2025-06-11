-- Disable trigger if it exists
ALTER TABLE hr_employee_promotions DISABLE TRIGGER ensure_promotion_date_order;
ALTER TABLE hr_employee_promotions DISABLE TRIGGER ensure_promotion_chain;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS ensure_promotion_date_order ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_date_order() CASCADE;
DROP TRIGGER IF EXISTS ensure_promotion_chain ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_chain() CASCADE; 