import { Router } from 'express';
import pool from '../../db';
import { authenticateToken } from '../../middleware/auth';
import { AuthenticatedRequest } from '../../types';

const router = Router();

// Get all agreements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.*,
        e.employee_name as spoc_name,
        array_agg(DISTINCT ta.name) as thematic_areas,
        array_agg(DISTINCT cc.name) as cdac_centres
      FROM agreements a
      LEFT JOIN hr_employees e ON a.spoc_id = e.employee_id
      LEFT JOIN UNNEST(a.thematic_area_ids) ta_id ON true
      LEFT JOIN thematic_areas ta ON ta_id = ta.id
      LEFT JOIN UNNEST(a.cdac_centre_ids) cc_id ON true
      LEFT JOIN cdac_centres cc ON cc_id = cc.id
      GROUP BY a.id, e.employee_name
      ORDER BY a.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching agreements:', error);
    res.status(500).json({ error: 'Failed to fetch agreements' });
  }
});

// Get agreement by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        a.*,
        e.employee_name as spoc_name,
        array_agg(DISTINCT ta.name) as thematic_areas,
        array_agg(DISTINCT cc.name) as cdac_centres
      FROM agreements a
      LEFT JOIN hr_employees e ON a.spoc_id = e.employee_id
      LEFT JOIN UNNEST(a.thematic_area_ids) ta_id ON true
      LEFT JOIN thematic_areas ta ON ta_id = ta.id
      LEFT JOIN UNNEST(a.cdac_centre_ids) cc_id ON true
      LEFT JOIN cdac_centres cc ON cc_id = cc.id
      WHERE a.id = $1
      GROUP BY a.id, e.employee_name
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Agreement not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching agreement:', error);
    res.status(500).json({ error: 'Failed to fetch agreement' });
  }
});

// Create new agreement
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      agreement_type,
      agreement_category,
      agreement_subtype,
      duration_months,
      title,
      thematic_area_ids,
      cdac_centre_ids,
      signing_agency,
      funding_source,
      total_value,
      scope,
      profile,
      legacy_status,
      signed_date,
      start_date,
      end_date,
      level,
      objectives,
      spoc_id,
      status
    } = req.body;

    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO agreements (
        agreement_type,
        agreement_category,
        agreement_subtype,
        duration_months,
        title,
        thematic_area_ids,
        cdac_centre_ids,
        signing_agency,
        funding_source,
        total_value,
        scope,
        profile,
        legacy_status,
        signed_date,
        start_date,
        end_date,
        level,
        objectives,
        spoc_id,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id
    `;

    const result = await client.query(insertQuery, [
      agreement_type,
      agreement_category,
      agreement_subtype,
      duration_months,
      title,
      thematic_area_ids,
      cdac_centre_ids,
      signing_agency,
      funding_source,
      total_value,
      scope,
      profile,
      legacy_status,
      signed_date,
      start_date,
      end_date,
      level,
      objectives,
      spoc_id,
      status || 'Active'
    ]);

    // Add initial activity
    const activityQuery = `
      INSERT INTO agreement_activities (
        agreement_id,
        activity_type,
        status,
        description,
        created_by
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(activityQuery, [
      result.rows[0].id,
      'Status Change',
      'Active',
      'Agreement created',
      spoc_id
    ]);

    await client.query('COMMIT');
    res.json({ message: 'Agreement created successfully', id: result.rows[0].id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating agreement:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create agreement' });
  } finally {
    client.release();
  }
});

// Update agreement
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      agreement_type,
      agreement_category,
      agreement_subtype,
      duration_months,
      title,
      thematic_area_ids,
      cdac_centre_ids,
      signing_agency,
      funding_source,
      total_value,
      scope,
      profile,
      legacy_status,
      signed_date,
      start_date,
      end_date,
      level,
      objectives,
      spoc_id,
      status
    } = req.body;

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE agreements SET
        agreement_type = $1,
        agreement_category = $2,
        agreement_subtype = $3,
        duration_months = $4,
        title = $5,
        thematic_area_ids = $6,
        cdac_centre_ids = $7,
        signing_agency = $8,
        funding_source = $9,
        total_value = $10,
        scope = $11,
        profile = $12,
        legacy_status = $13,
        signed_date = $14,
        start_date = $15,
        end_date = $16,
        level = $17,
        objectives = $18,
        spoc_id = $19,
        status = $20
      WHERE id = $21
    `;

    await client.query(updateQuery, [
      agreement_type,
      agreement_category,
      agreement_subtype,
      duration_months,
      title,
      thematic_area_ids,
      cdac_centre_ids,
      signing_agency,
      funding_source,
      total_value,
      scope,
      profile,
      legacy_status,
      signed_date,
      start_date,
      end_date,
      level,
      objectives,
      spoc_id,
      status,
      id
    ]);

    await client.query('COMMIT');
    res.json({ message: 'Agreement updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating agreement:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update agreement' });
  } finally {
    client.release();
  }
});

// Add activity to agreement
router.post('/:id/activities', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { activity_type, status, description } = req.body;

    await client.query('BEGIN');

    // Get the agreement's SPOC ID
    const agreementQuery = 'SELECT spoc_id FROM agreements WHERE id = $1';
    const agreementResult = await client.query(agreementQuery, [id]);
    
    if (agreementResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Agreement not found' });
      return;
    }

    const { spoc_id } = agreementResult.rows[0];

    // If status is being updated, update the agreement status
    if (activity_type === 'Status Change' && status) {
      await client.query(
        'UPDATE agreements SET status = $1 WHERE id = $2',
        [status, id]
      );
    }

    // Add activity
    const activityQuery = `
      INSERT INTO agreement_activities (
        agreement_id,
        activity_type,
        status,
        description,
        created_by
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(activityQuery, [
      id,
      activity_type,
      status,
      description,
      spoc_id
    ]);

    await client.query('COMMIT');
    res.json({ message: 'Activity added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding activity:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add activity' });
  } finally {
    client.release();
  }
});

// Get activities for an agreement
router.get('/:id/activities', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        aa.*,
        e.employee_name as created_by_name
      FROM agreement_activities aa
      LEFT JOIN hr_employees e ON aa.created_by = e.employee_id
      WHERE aa.agreement_id = $1
      ORDER BY aa.created_at DESC
    `;
    
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get lookup data
router.get('/lookup/data', authenticateToken, async (req, res) => {
  try {
    const thematicAreasQuery = 'SELECT id, name FROM thematic_areas ORDER BY name';
    const cdacCentresQuery = 'SELECT id, name FROM cdac_centres ORDER BY name';

    const [thematicAreas, cdacCentres] = await Promise.all([
      pool.query(thematicAreasQuery),
      pool.query(cdacCentresQuery)
    ]);

    res.json({
      thematicAreas: thematicAreas.rows,
      cdacCentres: cdacCentres.rows
    });
  } catch (error) {
    console.error('Error fetching lookup data:', error);
    res.status(500).json({ error: 'Failed to fetch lookup data' });
  }
});

export default router; 