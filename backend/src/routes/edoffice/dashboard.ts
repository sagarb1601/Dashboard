import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { pool } from '../../db/db';

const router = Router();

// Projects Info API
router.get('/projects-info', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get total projects count
    const projectsQuery = `
      SELECT COUNT(*) as total_projects 
      FROM technical_projects
    `;
    const projectsResult = await client.query(projectsQuery);
    const totalProjects = parseInt(projectsResult.rows[0].total_projects) || 0;

    // Get total publications count
    const publicationsQuery = `
      SELECT COUNT(*) as total_publications 
      FROM project_publications
    `;
    const publicationsResult = await client.query(publicationsQuery);
    const totalPublications = parseInt(publicationsResult.rows[0].total_publications) || 0;

    // Get total patents count
    const patentsQuery = `
      SELECT COUNT(*) as total_patents 
      FROM patents
    `;
    const patentsResult = await client.query(patentsQuery);
    const totalPatents = parseInt(patentsResult.rows[0].total_patents) || 0;

    // Get total proposals count
    const proposalsQuery = `
      SELECT COUNT(*) as total_proposals 
      FROM proposals
    `;
    const proposalsResult = await client.query(proposalsQuery);
    const totalProposals = parseInt(proposalsResult.rows[0].total_proposals) || 0;

    client.release();

    res.json({
      total_projects: totalProjects,
      total_publications: totalPublications,
      total_patents: totalPatents,
      total_proposals: totalProposals
    });

  } catch (error) {
    console.error('Error fetching projects info:', error);
    res.status(500).json({ error: 'Failed to fetch projects info' });
  }
});

// Technical Projects API
router.get('/technical-projects', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const projectsQuery = `
      SELECT 
        project_id as id,
        project_name,
        'Technical' as project_type,
        'Active' as status,
        created_at as start_date,
        created_at as end_date,
        0 as budget,
        'PI Name' as pi_name,
        group_name as department
      FROM technical_projects
      ORDER BY project_name
    `;
    
    const result = await client.query(projectsQuery);
    client.release();

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching technical projects:', error);
    res.status(500).json({ error: 'Failed to fetch technical projects' });
  }
});

// Publications API
router.get('/publications', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const publicationsQuery = `
      SELECT 
        publication_id as id,
        title,
        type,
        details,
        publication_date,
        authors,
        doi,
        publication_scope,
        impact_factor,
        created_at
      FROM project_publications
      ORDER BY publication_date DESC
    `;
    
    const result = await client.query(publicationsQuery);
    client.release();

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Failed to fetch publications' });
  }
});

// Patents API
router.get('/patents', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const patentsQuery = `
      SELECT 
        p.patent_id as id,
        p.patent_title as title,
        p.application_number,
        COALESCE(psh.new_status, p.status) as status,
        p.filing_date,
        p.grant_date,
        p.rejection_date,
        STRING_AGG(DISTINCT e.employee_name, ', ') as inventors,
        p.created_at
      FROM patents p
      LEFT JOIN (
        SELECT DISTINCT ON (patent_id) 
          patent_id, 
          new_status, 
          update_date
        FROM patent_status_history 
        ORDER BY patent_id, update_date DESC
      ) psh ON p.patent_id = psh.patent_id
      LEFT JOIN patent_inventors pi ON p.patent_id = pi.patent_id
      LEFT JOIN hr_employees e ON pi.employee_id = e.employee_id
      GROUP BY p.patent_id, p.patent_title, p.application_number, psh.new_status, p.status, 
               p.filing_date, p.grant_date, p.rejection_date, p.created_at
      ORDER BY p.filing_date DESC
    `;
    
    const result = await client.query(patentsQuery);
    client.release();

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching patents:', error);
    res.status(500).json({ error: 'Failed to fetch patents' });
  }
});

// Proposals API
router.get('/proposals', authenticateToken, async (req, res) => {
  console.log('Proposals endpoint called');
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established');
    
    // First check if table exists
    const tableCheckQuery = `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proposals');`;
    const tableExists = await client.query(tableCheckQuery);
    console.log('Proposals table exists:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      console.log('Proposals table does not exist');
      res.json([]);
      return;
    }
    
    // Simple query without any complex operations
    const proposalsQuery = `
      SELECT 
        proposal_id as id,
        proposal_title as title,
        'Other' as type,
        funding_agency,
        proposed_budget as budget,
        status,
        submission_date,
        approval_date,
        rejection_date,
        created_at
      FROM proposals
      ORDER BY submission_date DESC
    `;
    
    console.log('Executing proposals query...');
    const result = await client.query(proposalsQuery);
    console.log('Query executed successfully, rows returned:', result.rows.length);
    
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching proposals:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch proposals', details: errorMessage });
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
  }
});

// Test Proposals API
router.get('/test-proposals', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // First check if table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'proposals'
      );
    `;
    
    const tableExists = await client.query(tableCheckQuery);
    console.log('Proposals table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check table structure
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'proposals'
        ORDER BY ordinal_position;
      `;
      
      const structure = await client.query(structureQuery);
      console.log('Proposals table structure:', structure.rows);
      
      // Check if there's any data
      const countQuery = `SELECT COUNT(*) FROM proposals;`;
      const count = await client.query(countQuery);
      console.log('Proposals count:', count.rows[0].count);
      
      // Check if there are any technical_groups
      const groupsQuery = `SELECT COUNT(*) FROM technical_groups;`;
      const groupsCount = await client.query(groupsQuery);
      console.log('Technical groups count:', groupsCount.rows[0].count);
      
      // Check if there are any hr_employees
      const employeesQuery = `SELECT COUNT(*) FROM hr_employees;`;
      const employeesCount = await client.query(employeesQuery);
      console.log('HR employees count:', employeesCount.rows[0].count);
      
      // Try to get one proposal if exists
      if (parseInt(count.rows[0].count) > 0) {
        const sampleQuery = `SELECT * FROM proposals LIMIT 1;`;
        const sample = await client.query(sampleQuery);
        console.log('Sample proposal:', sample.rows[0]);
      }
    }
    
    client.release();
    res.json({ message: 'Check server logs for table info' });

  } catch (error) {
    console.error('Error testing proposals:', error);
    res.status(500).json({ error: 'Failed to test proposals' });
  }
});

// Simple Proposals API (for testing)
router.get('/simple-proposals', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const proposalsQuery = `
      SELECT 
        proposal_id as id,
        proposal_title as title,
        proposal_type as type,
        funding_agency,
        proposed_budget as budget,
        status,
        submission_date,
        approval_date,
        rejection_date,
        created_at
      FROM proposals
      ORDER BY submission_date DESC
    `;
    
    const result = await client.query(proposalsQuery);
    client.release();

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching simple proposals:', error);
    res.status(500).json({ error: 'Failed to fetch simple proposals' });
  }
});

// Test Proposals Table API
router.get('/test-proposals-table', authenticateToken, async (req, res) => {
  console.log('Test proposals table endpoint called');
  try {
    const client = await pool.connect();
    console.log('Database connection established');
    
    // First check if table exists
    const tableCheckQuery = `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proposals');`;
    const tableExists = await client.query(tableCheckQuery);
    console.log('Proposals table exists:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      client.release();
      res.json({ error: 'Proposals table does not exist' });
      return;
    }
    
    // Try a simple count query
    const countQuery = `SELECT COUNT(*) as count FROM proposals;`;
    const count = await client.query(countQuery);
    console.log('Proposals count:', count.rows[0].count);
    
    client.release();
    res.json({ 
      tableExists: tableExists.rows[0].exists,
      count: count.rows[0].count 
    });

  } catch (error) {
    console.error('Error testing proposals table:', error);
    res.status(500).json({ error: 'Failed to test proposals table' });
  }
});

// Proposal Status History API
router.get('/proposal-status-history/:id', authenticateToken, async (req, res) => {
  console.log('Proposal status history endpoint called for ID:', req.params.id);
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established');
    
    const proposalId = parseInt(req.params.id);
    
    const historyQuery = `
      SELECT 
        old_status,
        new_status,
        update_date,
        remarks
      FROM proposal_status_history
      WHERE proposal_id = $1
      ORDER BY update_date ASC
    `;
    
    console.log('Executing status history query...');
    const result = await client.query(historyQuery, [proposalId]);
    console.log('Status history query executed successfully, rows returned:', result.rows.length);
    
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching proposal status history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch proposal status history', details: errorMessage });
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
  }
});

export default router; 