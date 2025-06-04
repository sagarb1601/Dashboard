import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import StaffTab from './StaffTab';
import StaffSalaries from './StaffSalaries';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`staff-tabpanel-${index}`}
      aria-labelledby={`staff-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `staff-tab-${index}`,
    'aria-controls': `staff-tabpanel-${index}`,
  };
}

const StaffPage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ p: 3, pb: 0 }}>
        Staff Management
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange}
          aria-label="staff management tabs"
          sx={{ px: 3 }}
        >
          <Tab label="Staff List" {...a11yProps(0)} />
          <Tab label="Salaries" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <StaffTab />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <StaffSalaries />
      </TabPanel>
    </Box>
  );
};

export default StaffPage; 