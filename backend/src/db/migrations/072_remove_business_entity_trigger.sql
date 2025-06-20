-- Migration 072: Remove business entity trigger completely since API handles all checks

-- Drop the trigger and function completely
DROP TRIGGER IF EXISTS check_business_entity_usage ON business_entities;
DROP FUNCTION IF EXISTS check_business_entity_usage() CASCADE;

-- No new trigger needed - all business logic is handled in the API endpoint
-- This allows the API to:
-- 1. Check for payment milestones and show detailed dialog
-- 2. Check for purchase orders and show warning
-- 3. Handle cascade deletion properly
-- 4. Provide better user experience with proper error messages 