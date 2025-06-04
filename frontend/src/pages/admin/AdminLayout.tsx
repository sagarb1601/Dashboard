import React from 'react';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Engineering as EngineeringIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import ContractorsTab from './contractors/ContractorsTab';
import MappingTab from './contractors/MappingTab';
import StaffTab from './staff/StaffTab';
import StaffSalaries from './staff/StaffSalaries';
import AMC from './amc/AMC';

const drawerWidth = 240;

const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    {
      text: 'Contractors',
      icon: <EngineeringIcon />,
      path: '/admin/contractors'
    },
    {
      text: 'Contractor Mapping',
      icon: <BusinessIcon />,
      path: '/admin/mapping'
    },
    {
      text: 'Staff',
      icon: <GroupIcon />,
      path: '/admin/staff'
    },
    {
      text: 'Staff Salaries',
      icon: <MoneyIcon />,
      path: '/admin/staff/salaries'
    },
    {
      text: 'AMC Management',
      icon: <BuildIcon />,
      path: '/admin/amc'
    }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Dashboard
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Routes>
            <Route path="/contractors" element={<ContractorsTab />} />
            <Route path="/mapping" element={<MappingTab />} />
            <Route path="/staff" element={<StaffTab />} />
            <Route path="/staff/salaries" element={<StaffSalaries />} />
            <Route path="/amc/*" element={<AMC />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout; 