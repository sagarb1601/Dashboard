import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome, {user.username || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You are logged in as a {user.role || 'User'}
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard; 