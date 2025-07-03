import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

interface LoginResponse {
  token?: string;
  user?: {
    id: number;
    username: string;
    role: string;
  };
  error?: string;
}

interface UserResponse {
  id?: number;
  username?: string;
  role?: string;
  error?: string;
}

async function testLogin() {
  try {
    console.log('=== TESTING LOGIN ===\n');

    // Test login with 'ed' user
    console.log('1. Testing login with ed user:');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'ed',
        password: 'ed123'
      })
    });
    
    console.log('Login Status:', loginRes.status);
    const loginData: LoginResponse = await loginRes.json() as LoginResponse;
    console.log('Login Response:', loginData);

    if (loginData.token) {
      console.log('\n2. Testing /auth/me with token:');
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      console.log('Me Status:', meRes.status);
      const meData: UserResponse = await meRes.json() as UserResponse;
      console.log('Me Response:', meData);

      if (meData.id) {
        console.log('\n3. Testing admin dashboard with token:');
        const dashboardRes = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        console.log('Dashboard Status:', dashboardRes.status);
        const dashboardData = await dashboardRes.json();
        console.log('Dashboard Response:', dashboardData);
      }
    }

  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin(); 