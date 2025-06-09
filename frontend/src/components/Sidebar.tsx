import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import styles from './Sidebar.module.css';
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
  Business as BusinessIcon,
  Category as CategoryIcon,
  GroupWork as GroupWorkIcon,
  Receipt as ReceiptIcon,
  MiscellaneousServices as MiscellaneousServicesIcon,
  Inventory2 as Inventory2Icon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarTodayIcon,
  MenuBook as MenuBookIcon,
  Handshake as HandshakeIcon
} from '@mui/icons-material';

const Sidebar: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toLowerCase();
  const navigate = useNavigate();

  const iconProps = {
    onPointerEnterCapture: () => {},
    onPointerLeaveCapture: () => {}
  };

  const getMenuItems = (): MenuProps['items'] => {
    switch (role) {
      case 'finance':
        return [
          { 
            key: 'projects',
            icon: <ProjectIcon />,
            label: 'Projects',
            onClick: () => navigate('/finance')
          },
          { 
            key: 'budget',
            icon: <BudgetIcon />,
            label: 'Budget Fields',
            onClick: () => navigate('/finance/budget')
          },
          { 
            key: 'yearly-budget',
            icon: <YearlyBudgetIcon />,
            label: 'Yearly Budget',
            onClick: () => navigate('/finance/yearly-budget')
          },
          { 
            key: 'expenditure',
            icon: <ExpenditureIcon />,
            label: 'Expenditure',
            onClick: () => navigate('/finance/expenditure')
          },
          { 
            key: 'grant',
            icon: <GrantIcon />,
            label: 'Grant Received',
            onClick: () => navigate('/finance/grant-received')
          },
        ];

      case 'admin':
        return [
          { 
            key: 'contractors',
            icon: <TeamIcon />,
            label: 'Contractors',
            onClick: () => navigate('/admin/contractors')
          },
          { 
            key: 'staff',
            icon: <StaffIcon />,
            label: 'Staff',
            onClick: () => navigate('/admin/staff')
          },
          { 
            key: 'amc',
            icon: <BuildIcon />,
            label: 'AMC',
            onClick: () => navigate('/admin/amc')
          },
          { 
            key: 'vehicles',
            icon: <CarIcon />,
            label: 'Vehicles',
            onClick: () => navigate('/admin/vehicles')
          },
        ];

      case 'acts':
        return [
          { 
            key: 'courses',
            icon: <SchoolIcon />,
            label: 'Courses Info',
            onClick: () => navigate('/welcome')
          },
        ];

      case 'hr':
        return [
          { 
            key: 'employees',
            icon: <StaffIcon />,
            label: 'Employees',
            onClick: () => navigate('/hr/employees')
          },
          { 
            key: 'services',
            icon: <BuildIcon />,
            label: 'Services',
            onClick: () => navigate('/hr/services')
          },
          { 
            key: 'training',
            icon: <TrainingIcon />,
            label: 'Training',
            onClick: () => navigate('/hr/training')
          },
          { 
            key: 'recruitment',
            icon: <RecruitmentIcon />,
            label: 'Recruitment',
            onClick: () => navigate('/hr/recruitment')
          },
          { 
            key: 'manpower',
            icon: <ManpowerIcon />,
            label: 'Manpower',
            onClick: () => navigate('/hr/manpower')
          },
        ];

      case 'bd':
        return [
          {
            key: 'clients',
            icon: <BusinessIcon />,
            label: 'Clients',
            onClick: () => navigate('/business/clients')
          },
          {
            key: 'entities',
            icon: <CategoryIcon />,
            label: 'Business Entities',
            onClick: () => navigate('/business/entities')
          },
          {
            key: 'services',
            icon: <MiscellaneousServicesIcon />,
            label: 'BD Services',
            onClick: () => navigate('/business/services')
          },
          {
            key: 'products',
            icon: <Inventory2Icon />,
            label: 'BD Products',
            onClick: () => navigate('/business/products')
          },
          {
            key: 'projects',
            icon: <AssignmentIcon />,
            label: 'BD Projects',
            onClick: () => navigate('/business/projects')
          },
          {
            key: 'technical-groups',
            icon: <GroupWorkIcon />,
            label: 'Technical Groups',
            onClick: () => navigate('/business/technical-groups')
          },
          {
            key: 'purchase-orders',
            icon: <ReceiptIcon />,
            label: 'Purchase Orders',
            onClick: () => navigate('/business/purchase-orders')
          },
          {
            key: 'service-details',
            icon: <BuildIcon />,
            label: 'Service Details',
            onClick: () => navigate('/business/service-details')
          },
          {
            key: 'agreements',
            icon: <HandshakeIcon />,
            label: 'Agreements',
            onClick: () => navigate('/business/agreements')
          }
        ];

      case 'tg':
        return [
          {
            key: 'project-status',
            icon: <FolderOutlined {...iconProps} />,
            label: 'Project Status',
            onClick: () => navigate('/technical/project-status')
          },
          {
            key: 'events',
            icon: <FolderOutlined {...iconProps} />,
            label: 'Events',
            onClick: () => navigate('/technical/events')
          },
          {
            key: 'publications',
            icon: <FolderOutlined {...iconProps} />,
            label: 'Publications',
            onClick: () => navigate('/technical/publications')
          },
          {
            key: 'pi-copi',
            icon: <FolderOutlined {...iconProps} />,
            label: 'PI/CoPI Management',
            onClick: () => navigate('/technical/pi-copi')
          }
        ];

      default:
        return [];
    }
  };

  return (
    <div className={styles.menuContainer}>
      <Menu
        mode="inline"
        items={getMenuItems()}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default Sidebar; 