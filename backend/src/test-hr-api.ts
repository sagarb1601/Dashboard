import fetch from 'node-fetch';

async function testHRApi() {
  try {
    console.log('Testing HR API endpoints on port 5000...\n');

    // Test summary endpoint
    console.log('1. Testing /api/hr/dashboard/summary');
    const summaryResponse = await fetch('http://localhost:5000/api/hr/dashboard/summary', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but we can see if route exists
      }
    });
    console.log('Summary response status:', summaryResponse.status);
    console.log('Summary response headers:', summaryResponse.headers.get('content-type'));
    
    if (summaryResponse.status === 401) {
      console.log('✅ Route exists but authentication failed (expected)');
    } else if (summaryResponse.status === 404) {
      console.log('❌ Route not found');
    } else {
      console.log('⚠️ Unexpected status:', summaryResponse.status);
    }

    // Test department distribution endpoint
    console.log('\n2. Testing /api/hr/dashboard/department-distribution');
    const deptResponse = await fetch('http://localhost:5000/api/hr/dashboard/department-distribution', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Department response status:', deptResponse.status);
    
    if (deptResponse.status === 401) {
      console.log('✅ Route exists but authentication failed (expected)');
    } else if (deptResponse.status === 404) {
      console.log('❌ Route not found');
    } else {
      console.log('⚠️ Unexpected status:', deptResponse.status);
    }

    // Test employee growth endpoint
    console.log('\n3. Testing /api/hr/dashboard/employee-growth');
    const growthResponse = await fetch('http://localhost:5000/api/hr/dashboard/employee-growth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Growth response status:', growthResponse.status);
    
    if (growthResponse.status === 401) {
      console.log('✅ Route exists but authentication failed (expected)');
    } else if (growthResponse.status === 404) {
      console.log('❌ Route not found');
    } else {
      console.log('⚠️ Unexpected status:', growthResponse.status);
    }

    // Test a known working route for comparison
    console.log('\n4. Testing a known working route for comparison');
    const testResponse = await fetch('http://localhost:5000/api/acts/dashboard/summary', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('ACTS dashboard response status:', testResponse.status);

  } catch (error) {
    console.error('Error testing HR API:', error);
  }
}

testHRApi(); 