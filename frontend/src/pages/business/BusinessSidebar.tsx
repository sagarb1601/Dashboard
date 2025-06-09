import React from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Handshake as HandshakeIcon
} from '@mui/icons-material';

const BusinessSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Business Entities', icon: <BusinessIcon />, path: '/business/entities' },
    { text: 'Services', icon: <DescriptionIcon />, path: '/business/services' },
    { text: 'Agreements', icon: <HandshakeIcon />, path: '/business/agreements' }
  ];

  return (
    <List>
      {menuItems.map((item) => (
        <ListItemButton
          key={item.text}
          selected={location.pathname === item.path}
          onClick={() => navigate(item.path)}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      ))}
    </List>
  );
};

export default BusinessSidebar; 