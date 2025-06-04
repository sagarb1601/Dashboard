-- Map default budget fields to all existing projects that don't have them
INSERT INTO project_budget_fields_mapping (project_id, field_id, is_custom)
SELECT fp.project_id, bf.field_id, false
FROM finance_projects fp
CROSS JOIN budget_fields bf
WHERE bf.is_default = true
AND NOT EXISTS (
  SELECT 1
  FROM project_budget_fields_mapping pbfm
  WHERE pbfm.project_id = fp.project_id
  AND pbfm.field_id = bf.field_id
); 