-- Rename projects_bd table to business_division_projects to avoid collision
ALTER TABLE IF EXISTS projects_bd RENAME TO business_division_projects;

-- Rename the indexes to match the new table name
ALTER INDEX IF EXISTS idx_projects_entity RENAME TO idx_bd_projects_entity;

-- Rename the trigger
DROP TRIGGER IF EXISTS validate_project_entity_type ON business_division_projects;
CREATE TRIGGER validate_project_entity_type
    BEFORE INSERT OR UPDATE ON business_division_projects
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_entity_type();

DROP TRIGGER IF EXISTS update_projects_updated_at ON business_division_projects;
CREATE TRIGGER update_bd_projects_updated_at
    BEFORE UPDATE ON business_division_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 