import React from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  reference?: string;
  children: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ reference, children }) => {
  return (
    <Box sx={{ mb: 3 }}>
      {reference && (
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1,
            color: 'text.secondary',
            fontStyle: 'italic'
          }}
        >
          reference: {reference}
        </Typography>
      )}
      {children}
    </Box>
  );
};

export default PageHeader; 