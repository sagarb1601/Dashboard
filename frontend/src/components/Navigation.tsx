import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const items = [
  {
    key: 'hr',
    label: 'HR',
    // @ts-ignore - Ant Design icon type issue
    icon: <TeamOutlined />,
    children: [
      {
        key: 'employees',
        label: <Link to="/hr/employees">Employees</Link>,
      },
      {
        key: 'services',
        label: <Link to="/hr/services">Services</Link>,
      },
      {
        key: 'training',
        label: <Link to="/hr/training">Training</Link>,
      },
      {
        key: 'recruitment',
        label: <Link to="/hr/recruitment">Recruitment</Link>,
      },
    ],
  },
  {
    key: 'mmg',
    label: <Link to="/mmg/procurements">MMG</Link>,
    // @ts-ignore - Ant Design icon type issue
    icon: <TeamOutlined />,
  },
] as MenuProps['items'];

const Navigation: React.FC = () => {
  return (
    <div>
      <Menu items={items} />
    </div>
  );
};

export default Navigation; 