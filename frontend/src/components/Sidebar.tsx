import React, { useState, useEffect } from 'react';
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
  ListAlt as BudgetIcon,
  Assessment as ExpenditureIcon,
  AccountBalanceWallet as GrantIcon,
  Home as HomeIcon,
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
  FlightTakeoff as FlightTakeoffIcon,
  ListAlt as ListAltIcon,
  CalendarMonth as CalendarMonthIcon,
  RecordVoiceOver as TalkIcon,
  FlightLand as FlightLandIcon,
  Science as ScienceIcon,
  Lightbulb as LightbulbIcon,
  History as HistoryIcon,
  AttachMoney as AttachMoneyIcon,
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

  // Suppress ResizeObserver errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('ResizeObserver')) {
        return;
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

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
          { text: 'Finance Home', icon: <HomeIcon />, path: '/finance/home' },
          { text: 'Projects', icon: <ProjectIcon />, path: '/finance' },
          { text: 'Budget Fields', icon: <BudgetIcon />, path: '/finance/budget' },
          { text: 'Yearly Budget', icon: <CalendarIcon />, path: '/finance/yearly-budget' },
          { text: 'Grant Received', icon: <GrantIcon />, path: '/finance/grant-received' },
          { text: 'Expenditure', icon: <ExpenditureIcon />, path: '/finance/expenditure' },
          
        ];
      case 'admin':
        return [
          { text: 'Admin Home', icon: <HomeIcon />, path: '/admin/home' },
          { text: 'Contractors', icon: <TeamIcon />, path: '/admin/contractors' },
          { text: 'Staff', icon: <StaffIcon />, path: '/admin/staff' },
          { text: 'AMC', icon: <BuildIcon />, path: '/admin/amc' },
          { text: 'Vehicles', icon: <CarIcon />, path: '/admin/vehicles' },
        ];
      case 'acts':
        return [
          { text: 'Courses Info', icon: <SchoolIcon />, path: '/acts/courses' },
        ];
      case 'hr':
        return [
          { text: 'Employees', icon: <StaffIcon />, path: '/hr/employees' },
          { text: 'Services', icon: <BuildIcon />, path: '/hr/services' },
          { text: 'Training', icon: <TrainingIcon />, path: '/hr/training' },
          { text: 'Recruitment', icon: <RecruitmentIcon />, path: '/hr/recruitment' },
          { text: 'Manpower', icon: <ManpowerIcon />, path: '/hr/manpower' },
          { text: 'Bulk Employee Upload', icon: <AssignmentIcon />, path: '/hr/bulk-upload' },
          { text: 'Group Management', icon: <GroupWorkIcon />, path: '/hr/group-management' },
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
            text: 'PO Status Management',
            icon: <HistoryIcon />,
            path: '/business/purchase-order-status'
          },
          // {
          //   text: 'Service Details',
          //   icon: <BuildIcon />,
          //   path: '/business/service-details'
          // },
          {
            text: 'Agreements',
            icon: <BuildIcon />,
            path: '/business/agreements'
          },
          {
            text: 'SLA Fund',
            icon: <BuildIcon />,
            path: '/business/sla-funds'
          }
        ];
      case 'tg':
        return [
          
          {
            text: 'Project Status',
            icon: <AssignmentIcon />,
            path: '/technical/project-status'
          },
          {
            text: 'Project Management',
            icon: <AssignmentIcon />,
            path: '/technical/project-management'
          },
          {
            text: 'PI/COPI',
            icon: <BuildIcon />,
            path: '/technical/pi-copi'
          },
          {
            text: 'Technical Activities',
            icon: <ScienceIcon />,
            children: [
              {
                text: 'Publications',
                icon: <FolderIcon />,
                path: '/technical/publications'
              },
              {
                text: 'Events',
                icon: <CalendarIcon />,
                path: '/technical/events'
              },
              {
                text: 'Patents',
                icon: <LightbulbIcon />,
                path: '/technical/patents'
              },
              {
                text: 'Proposals',
                icon: <AssignmentIcon />,
                path: '/technical/proposals'
              }
            ]
          }
        ];
      case 'edofc':
        return [
          //{ text: 'Calendar/Events', icon: <CalendarIcon />, path: '/edofc/calendar' },
          { text: 'Full Calendar', icon: <CalendarIcon />, path: '/edofc/full-calendar' },
          {
            text: 'Tours & Travels',
            icon: <FlightTakeoffIcon />,
            children: [
              {
                text: 'Travel List',
                icon: <ListAltIcon />,
                path: '/edofc/travels'
              },
              {
                text: 'Travel Calendar',
                icon: <CalendarMonthIcon />,
                path: '/edofc/travels/calendar'
              }
            ]
          },
          { text: 'Talks', icon: <TalkIcon />, path: '/edofc/talks' },
        ];
      case 'ed':
        return [
          { text: 'Finance Dashboard', icon: <DashboardIcon />, path: '/ed/finance-dashboard' },
          { text: 'Admin Dashboard', icon: <BuildIcon />, path: '/ed/admin-dashboard' },
          { text: 'ACTS Dashboard', icon: <SchoolIcon />, path: '/ed/acts-dashboard' },
          { text: 'HR Dashboard', icon: <StaffIcon />, path: '/ed/hr-dashboard' },
          { text: 'MMG Dashboard', icon: <Inventory2Icon />, path: '/ed/mmg-dashboard' },
          { text: 'Technical Dashboard', icon: <ScienceIcon />, path: '/ed/technical-dashboard' },
          { text: 'Business Dashboard', icon: <BusinessIcon />, path: '/ed/business-dashboard' },
          { text: 'Calendar', icon: <CalendarIcon />, path: '/ed/calendar' },
          { text: 'Events', icon: <CalendarMonthIcon />, path: '/ed/events' },
          // { text: 'Attendance', icon: <ListAltIcon />, path: '/ed/attendance' },  // Commented out as functionality moved to Events page
          { text: 'Travel List', icon: <FlightTakeoffIcon />, path: '/ed/travel-list' },
          { text: 'Travel Calendar', icon: <FlightLandIcon />, path: '/ed/travel-calendar' }
        ];
      case 'mmg':
        return [
          { text: 'Procurement', icon: <ReceiptIcon />, path: '/mmg/procurements' },
        ];
      case 'hpc':
        return [
          {
            text: 'Group Projects',
            icon: <GroupWorkIcon />,
            path: '/hpc/projects'
          },
          {
            text: 'Project Status',
            icon: <AssignmentIcon />,
            path: '/hpc/project-status'
          },
          {
            text: 'PI/COPI',
            icon: <BuildIcon />,
            path: '/hpc/pi-copi'
          },
          {
            text: 'Publications',
            icon: <FolderIcon />,
            path: '/hpc/publications'
          },
          {
            text: 'Events',
            icon: <CalendarIcon />,
            path: '/hpc/events'
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