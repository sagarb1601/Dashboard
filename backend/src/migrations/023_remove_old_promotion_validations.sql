-- Drop old triggers and functions that enforce strict chronological order
DROP TRIGGER IF EXISTS ensure_promotion_date_order ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_date_order();

-- Drop any other old validation triggers and functions
DROP TRIGGER IF EXISTS ensure_promotion_chain ON hr_employee_promotions;
DROP FUNCTION IF EXISTS check_promotion_chain();

-- Add comment to track this change
COMMENT ON TABLE hr_employee_promotions IS 'Stores employee promotion history. Date order validation removed to allow adding historical records.'; 