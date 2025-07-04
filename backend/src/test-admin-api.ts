import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAdminAPI() {
  try {
    console.log('=== TESTING ADMIN DASHBOARD API ENDPOINTS ===\n');

    // Test summary endpoint
    console.log('1. Testing /admin/dashboard/summary:');
    const summaryRes = await fetch(`${BASE_URL}/admin/dashboard/summary`);
    console.log('Status:', summaryRes.status);
    const summaryData = await summaryRes.json();
    console.log('Response:', summaryData);

    // Test staff by department endpoint
    console.log('\n2. Testing /admin/dashboard/staff-by-department:');
    const staffDeptRes = await fetch(`${BASE_URL}/admin/dashboard/staff-by-department`);
    console.log('Status:', staffDeptRes.status);
    const staffDeptData = await staffDeptRes.json();
    console.log('Response:', staffDeptData);

    // Test vehicle status endpoint
    console.log('\n3. Testing /admin/dashboard/vehicle-status:');
    const vehicleStatusRes = await fetch(`${BASE_URL}/admin/dashboard/vehicle-status`);
    console.log('Status:', vehicleStatusRes.status);
    const vehicleStatusData = await vehicleStatusRes.json();
    console.log('Response:', vehicleStatusData);

    // Test contractor status endpoint
    console.log('\n4. Testing /admin/dashboard/contractor-status:');
    const contractorStatusRes = await fetch(`${BASE_URL}/admin/dashboard/contractor-status`);
    console.log('Status:', contractorStatusRes.status);
    const contractorStatusData = await contractorStatusRes.json();
    console.log('Response:', contractorStatusData);

    // Test AMC status endpoint
    console.log('\n5. Testing /admin/dashboard/amc-status:');
    const amcStatusRes = await fetch(`${BASE_URL}/admin/dashboard/amc-status`);
    console.log('Status:', amcStatusRes.status);
    const amcStatusData = await amcStatusRes.json();
    console.log('Response:', amcStatusData);

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAdminAPI(); 