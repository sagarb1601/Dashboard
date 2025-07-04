import { pool } from './db/db';

async function testProjectsInfo() {
  try {
    const client = await pool.connect();
    
    console.log('Testing Projects Info API data...\n');
    
    // Get total projects count
    const projectsQuery = `
      SELECT COUNT(*) as total_projects 
      FROM technical_projects
    `;
    const projectsResult = await client.query(projectsQuery);
    const totalProjects = parseInt(projectsResult.rows[0].total_projects) || 0;
    console.log('Total Projects:', totalProjects);

    // Get total publications count
    const publicationsQuery = `
      SELECT COUNT(*) as total_publications 
      FROM project_publications
    `;
    const publicationsResult = await client.query(publicationsQuery);
    const totalPublications = parseInt(publicationsResult.rows[0].total_publications) || 0;
    console.log('Total Publications:', totalPublications);

    // Get total patents count
    const patentsQuery = `
      SELECT COUNT(*) as total_patents 
      FROM patents
    `;
    const patentsResult = await client.query(patentsQuery);
    const totalPatents = parseInt(patentsResult.rows[0].total_patents) || 0;
    console.log('Total Patents:', totalPatents);

    // Get total proposals count
    const proposalsQuery = `
      SELECT COUNT(*) as total_proposals 
      FROM proposals
    `;
    const proposalsResult = await client.query(proposalsQuery);
    const totalProposals = parseInt(proposalsResult.rows[0].total_proposals) || 0;
    console.log('Total Proposals:', totalProposals);

    console.log('\nFinal result:');
    console.log({
      total_projects: totalProjects,
      total_publications: totalPublications,
      total_patents: totalPatents,
      total_proposals: totalProposals
    });

    client.release();
  } catch (error) {
    console.error('Error testing projects info:', error);
  } finally {
    process.exit(0);
  }
}

testProjectsInfo(); 