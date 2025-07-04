import pool from './db';

async function addSampleTechnicalData() {
  try {
    console.log('Adding sample technical data...');

    // Add sample technical projects
    await pool.query(`
      INSERT INTO technical_projects (project_name, project_description, group_name, created_at)
      VALUES 
        ('AI Research Project', 'Advanced AI research for healthcare applications', 'AI Group', '2024-01-15'),
        ('Cloud Infrastructure Development', 'Building scalable cloud infrastructure', 'Cloud Group', '2024-02-10'),
        ('Blockchain Innovation', 'Blockchain-based supply chain solution', 'Blockchain Group', '2023-11-20'),
        ('IoT Platform Development', 'Internet of Things platform for smart cities', 'IoT Group', '2024-03-05'),
        ('Machine Learning Framework', 'ML framework for data analysis', 'ML Group', '2024-01-25'),
        ('Cybersecurity Enhancement', 'Advanced cybersecurity protocols', 'Security Group', '2024-02-28'),
        ('Data Analytics Platform', 'Big data analytics platform', 'Analytics Group', '2023-10-15'),
        ('Mobile App Development', 'Cross-platform mobile application', 'Mobile Group', '2024-03-01')
      ON CONFLICT DO NOTHING
    `);

    // Add sample publications
    await pool.query(`
      INSERT INTO project_publications (project_id, type, title, details, publication_date, authors, created_at)
      VALUES 
        (1, 'Journal', 'AI in Healthcare: A Comprehensive Review', 'A review of AI in healthcare.', '2024-01-20', 'Dr. Smith, Dr. Johnson', '2024-01-20'),
        (2, 'Conference', 'Cloud Computing Trends 2024', 'Trends in cloud computing.', '2024-02-15', 'Dr. Brown, Dr. Davis', '2024-02-15'),
        (3, 'Journal', 'Blockchain Applications in Supply Chain', 'Blockchain in supply chain.', '2024-01-10', 'Dr. Wilson, Dr. Taylor', '2024-01-10'),
        (4, 'Workshop', 'IoT Security Challenges', 'Security in IoT.', '2024-03-01', 'Dr. Anderson, Dr. Thomas', '2024-03-01'),
        (5, 'Conference', 'Machine Learning for Data Analysis', 'ML for data analysis.', '2024-02-28', 'Dr. Jackson, Dr. White', '2024-02-28'),
        (6, 'Journal', 'Cybersecurity Best Practices', 'Best practices in cybersecurity.', '2024-01-30', 'Dr. Harris, Dr. Martin', '2024-01-30')
      ON CONFLICT DO NOTHING
    `);

    // Add sample patents
    await pool.query(`
      INSERT INTO patents (patent_title, filing_date, application_number, status, status_update_date, group_id, created_at)
      VALUES 
        ('AI-Powered Diagnostic System', '2024-01-25', 'APP2024001', 'Filed', '2024-01-25', 1, '2024-01-25'),
        ('Blockchain Data Verification', '2024-02-20', 'APP2024002', 'Under Review', '2024-02-20', 2, '2024-02-20'),
        ('IoT Device Management Platform', '2024-03-05', 'APP2024003', 'Granted', '2024-03-05', 3, '2024-03-05'),
        ('Machine Learning Algorithm', '2024-01-15', 'APP2024004', 'Filed', '2024-01-15', 4, '2024-01-15'),
        ('Cybersecurity Framework', '2024-02-10', 'APP2024005', 'Under Review', '2024-02-10', 5, '2024-02-10'),
        ('Cloud Resource Optimization', '2024-03-01', 'APP2024006', 'Rejected', '2024-03-01', 6, '2024-03-01')
      ON CONFLICT DO NOTHING
    `);

    console.log('Sample technical data added successfully!');
  } catch (error) {
    console.error('Error adding sample technical data:', error);
  } finally {
    await pool.end();
  }
}

addSampleTechnicalData(); 