import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function addSampleMMGData() {
  try {
    console.log('Adding sample MMG data...');

    // Add sample procurements
    await pool.query(`
      INSERT INTO procurements (indent_number, title, project_id, indentor_id, group_id, purchase_type, delivery_place, status, estimated_cost, sourcing_method, indent_date, mmg_acceptance_date, created_at) VALUES
      ('IND-2024-001', 'Laptop Procurement for Development Team', 1, 102347, 1, 'Capital Equipment', 'CDAC KP', 'Pending Approval', 250000.00, 'TENDER', '2024-01-15', '2024-01-15', '2024-01-15 10:00:00'),
      ('IND-2024-002', 'Office Supplies and Stationery', 2, 102346, 2, 'Consumables', 'CDAC EC1', 'Approved', 50000.00, 'GEM', '2024-02-20', '2024-02-20', '2024-02-20 14:30:00'),
      ('IND-2024-003', 'Server Hardware for Data Center', 3, 102345, 3, 'Capital Equipment', 'CDAC EC2', 'In Progress', 500000.00, 'TENDER', '2024-03-10', '2024-03-10', '2024-03-10 09:15:00'),
      ('IND-2024-004', 'Software Licenses', 4, 102347, 4, 'Stock & Sale', 'CDAC KP', 'Completed', 150000.00, 'GEM', '2024-04-05', '2024-04-05', '2024-04-05 16:45:00'),
      ('IND-2024-005', 'Network Equipment', 5, 102346, 5, 'Capital Equipment', 'CDAC EC1', 'Pending Approval', 300000.00, 'TENDER', '2024-05-12', '2024-05-12', '2024-05-12 11:20:00'),
      ('IND-2024-006', 'Laboratory Chemicals', 6, 102345, 6, 'Consumables', 'CDAC EC2', 'Approved', 75000.00, 'GEM', '2024-06-18', '2024-06-18', '2024-06-18 13:40:00'),
      ('IND-2024-007', 'Furniture for New Office', 7, 102347, 1, 'Capital Equipment', 'CDAC KP', 'In Progress', 200000.00, 'TENDER', '2024-07-22', '2024-07-22', '2024-07-22 08:30:00'),
      ('IND-2024-008', 'Printing and Paper Supplies', 8, 102346, 2, 'Consumables', 'CDAC EC1', 'Completed', 25000.00, 'GEM', '2024-08-30', '2024-08-30', '2024-08-30 15:10:00'),
      ('IND-2024-009', 'Security Cameras', 9, 102345, 3, 'Capital Equipment', 'CDAC EC2', 'Pending Approval', 180000.00, 'TENDER', '2024-09-15', '2024-09-15', '2024-09-15 12:00:00'),
      ('IND-2024-010', 'Training Materials', 10, 102347, 4, 'Stock & Sale', 'CDAC KP', 'Approved', 60000.00, 'GEM', '2024-10-20', '2024-10-20', '2024-10-20 10:45:00')
      ON CONFLICT DO NOTHING;
    `);

    // Add sample procurement bids
    await pool.query(`
      INSERT INTO procurement_bids (procurement_id, tender_number, bids_received_count, finalized_vendor, notes, created_at) VALUES
      (1, 'TENDER-2024-001', 5, 'Tech Solutions Ltd', 'Multiple competitive bids received', '2024-01-20 14:00:00'),
      (2, 'GEM-2024-001', 3, 'Office Supplies Co', 'Direct procurement through GEM portal', '2024-02-25 11:30:00'),
      (3, 'TENDER-2024-002', 7, 'Server Systems Inc', 'High competition, good pricing', '2024-03-15 16:20:00'),
      (4, 'GEM-2024-002', 2, 'Software Solutions', 'Limited vendors for specialized software', '2024-04-10 09:45:00'),
      (5, 'TENDER-2024-003', 4, 'Network Solutions', 'Competitive bidding process', '2024-05-18 13:15:00'),
      (6, 'GEM-2024-003', 6, 'Chemical Supplies Ltd', 'Multiple vendors available', '2024-06-25 10:30:00'),
      (7, 'TENDER-2024-004', 3, 'Furniture World', 'Quality focused selection', '2024-07-28 15:45:00'),
      (8, 'GEM-2024-004', 4, 'Print Solutions', 'Cost effective procurement', '2024-08-30 12:00:00'),
      (9, 'TENDER-2024-005', 5, 'Security Systems Co', 'Technical evaluation completed', '2024-09-20 14:30:00'),
      (10, 'GEM-2024-005', 3, 'Training Materials Ltd', 'Direct procurement successful', '2024-10-25 11:15:00')
      ON CONFLICT DO NOTHING;
    `);

    // Add sample purchase orders
    await pool.query(`
      INSERT INTO purchase_orders (entity_id, invoice_no, invoice_date, invoice_value, payment_duration, invoice_status, requested_by, payment_mode, remarks, created_at) VALUES
      (1, 'INV-2024-001', '2024-01-25', 240000.00, 'Monthly', 'Paid', 1001, 'Online Transfer', 'Laptop procurement completed', '2024-01-25 10:00:00'),
      (2, 'INV-2024-002', '2024-02-28', 48000.00, 'One-time', 'Paid', 1002, 'Online Transfer', 'Office supplies delivered', '2024-02-28 14:30:00'),
      (3, 'INV-2024-003', '2024-03-20', 480000.00, 'Quarterly', 'Pending', 1003, 'Online Transfer', 'Server hardware in transit', '2024-03-20 09:15:00'),
      (4, 'INV-2024-004', '2024-04-15', 145000.00, 'One-time', 'Paid', 1004, 'Online Transfer', 'Software licenses activated', '2024-04-15 16:45:00'),
      (5, 'INV-2024-005', '2024-05-25', 285000.00, 'Monthly', 'Approved', 1005, 'Online Transfer', 'Network equipment ordered', '2024-05-25 11:20:00'),
      (6, 'INV-2024-006', '2024-06-30', 72000.00, 'One-time', 'Paid', 1006, 'Online Transfer', 'Chemicals delivered to lab', '2024-06-30 13:40:00'),
      (7, 'INV-2024-007', '2024-07-30', 190000.00, 'Monthly', 'Pending', 1007, 'Online Transfer', 'Furniture installation in progress', '2024-07-30 08:30:00'),
      (8, 'INV-2024-008', '2024-08-31', 24000.00, 'One-time', 'Paid', 1008, 'Online Transfer', 'Printing supplies received', '2024-08-31 15:10:00'),
      (9, 'INV-2024-009', '2024-09-25', 170000.00, 'Monthly', 'Approved', 1009, 'Online Transfer', 'Security system installation planned', '2024-09-25 12:00:00'),
      (10, 'INV-2024-010', '2024-10-30', 58000.00, 'One-time', 'Pending', 1010, 'Online Transfer', 'Training materials being prepared', '2024-10-30 10:45:00')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Sample MMG data added successfully!');
  } catch (error) {
    console.error('Error adding sample MMG data:', error);
  } finally {
    await pool.end();
  }
}

addSampleMMGData(); 