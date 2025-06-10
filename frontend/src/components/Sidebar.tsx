import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as TeamIcon,
  People as StaffIcon,
  MonetizationOn as BudgetIcon,
  Assessment as ExpenditureIcon,
  AccountBalanceWallet as GrantIcon,
  Business as ProjectIcon,
  CalendarToday as CalendarIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  WorkHistory as TrainingIcon,
  PersonAdd as RecruitmentIcon,
  PeopleAlt as ManpowerIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  GroupWork as GroupWorkIcon,
  Receipt as ReceiptIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  MiscellaneousServices as MiscellaneousServicesIcon,
  Inventory2 as Inventory2Icon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role?.toLowerCase();

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      setOpenMenus(prev => ({
        ...prev,
        [item.text]: !prev[item.text]
      }));
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const getMenuItems = (): MenuItem[] => {
    switch (userRole) {
      case 'finance':
        return [
          { text: 'Projects', icon: <ProjectIcon />, path: '/finance' },
          { text: 'Budget Fields', icon: <BudgetIcon />, path: '/finance/budget' },
          { text: 'Yearly Budget', icon: <CalendarIcon />, path: '/finance/yearly-budget' },
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
      case 'bd':
        return [
          {
            text: 'Clients',
            icon: <BusinessIcon />,
            path: '/business/clients'
          },
          {
            text: 'Business Entities',
            icon: <CategoryIcon />,
            path: '/business/entities'
          },
          {
            text: 'BD Services',
            icon: <MiscellaneousServicesIcon />,
            path: '/business/services'
          },
          {
            text: 'BD Products',
            icon: <Inventory2Icon />,
            path: '/business/products'
          },
          {
            text: 'BD Projects',
            icon: <AssignmentIcon />,
            path: '/business/projects'
          },
          {
            text: 'Technical Groups',
            icon: <GroupWorkIcon />,
            path: '/business/technical-groups'
          },
          {
            text: 'Purchase Orders',
            icon: <ReceiptIcon />,
            path: '/business/purchase-orders'
          },
          {
            text: 'Service Details',
            icon: <BuildIcon />,
            path: '/business/service-details'
          },

          {
            text: 'Agreements',
            icon: <BuildIcon />,
            path: '/business/agreements'
          },

          {
            text: 'SLA Fund',
            icon: <BuildIcon />,
            path: '/business/sla-fund'
          }

        ];
      case 'tg':
        return [
          {
            text: 'Group Projects',
            icon: <GroupWorkIcon />,
            path: '/technical/group-projects'
          },
          {
            text: 'Project Status',
            icon: <AssignmentIcon />,
            path: '/technical/project-status'
          },
          {
            text: 'PI/COPI',
            icon: <BuildIcon />,
            path: '/technical/pi-copi'
          },
          {
            text: 'Publications',
            icon: <FolderIcon />,
            path: '/technical/publications'
          },
          {
            text: 'Events',
            icon: <CalendarIcon />,
            path: '/technical/events'
          }
        ];
      default:
        return [];
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    const isSelected = item.path === location.pathname;
    const isOpen = openMenus[item.text];

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding>
          <ListItemButton
            selected={isSelected}
            onClick={() => handleMenuClick(item)}
            sx={item.children ? {} : undefined}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.text} />
            {item.children && (
              isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
            )}
          </ListItemButton>
        </ListItem>
        {item.children && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <ListItemButton
                  key={child.text}
                  selected={child.path === location.pathname}
                  onClick={() => child.path && navigate(child.path)}
                  sx={{ pl: 4 }}
                >
                  <ListItemText primary={child.text} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <List>
      {getMenuItems().map(renderMenuItem)}
    </List>
  );
};

export default Sidebar; 