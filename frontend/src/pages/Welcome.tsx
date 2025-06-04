import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setUsername(user.username);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
            Welcome, {username}!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Thank you for logging in to your dashboard.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Logout
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Welcome; 