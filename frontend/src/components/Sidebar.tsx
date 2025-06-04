import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as TeamIcon,
  People as StaffIcon,
  MonetizationOn as BudgetIcon,
  Assessment as ExpenditureIcon,
  AccountBalanceWallet as GrantIcon,
  Business as ProjectIcon,
  CalendarToday as YearlyBudgetIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  WorkHistory as TrainingIcon,
  PersonAdd as RecruitmentIcon,
  PeopleAlt as ManpowerIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role?.toLowerCase();

  const getMenuItems = () => {
    switch (userRole) {
      case 'finance':
        return [
          { text: 'Projects', icon: <ProjectIcon />, path: '/finance' },
          { text: 'Budget Fields', icon: <BudgetIcon />, path: '/finance/budget' },
          { text: 'Yearly Budget', icon: <YearlyBudgetIcon />, path: '/finance/yearly-budget' },
          { text: 'Expenditure', icon: <ExpenditureIcon />, path: '/finance/expenditure' },
          { text: 'Grant Received', icon: <GrantIcon />, path: '/finance/grant-received' },
        ];
      case 'admin':
        return [
          { text: 'Contractors', icon: <TeamIcon />, path: '/admin/contractors' },
          { text: 'Staff', icon: <StaffIcon />, path: '/admin/staff' },
          { text: 'AMC', icon: <BuildIcon />, path: '/admin/amc' },
          { text: 'Vehicles', icon: <CarIcon />, path: '/admin/vehicles' },
        ];
      case 'acts':
        return [
          { text: 'Courses Info', icon: <SchoolIcon />, path: '/welcome' },
        ];
      case 'hr':
        return [
          { text: 'Employees', icon: <StaffIcon />, path: '/hr/employees' },
          { text: 'Services', icon: <BuildIcon />, path: '/hr/services' },
          { text: 'Training', icon: <TrainingIcon />, path: '/hr/training' },
          { text: 'Recruitment', icon: <RecruitmentIcon />, path: '/hr/recruitment' },
          { text: 'Manpower', icon: <ManpowerIcon />, path: '/hr/manpower' },
        ];
      default:
        return [];
    }
  };

  return (
    <List>
      {getMenuItems().map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default Sidebar; 