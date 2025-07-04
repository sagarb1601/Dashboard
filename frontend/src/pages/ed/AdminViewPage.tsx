import React, { useState, useEffect } from 'react';
import { Tabs, Button, Dropdown, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { useAntDesignDropdownFix } from '../../utils/resizeObserverFix';

const { TabPane } = Tabs;

const AdminViewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Use specific Ant Design Dropdown fix
  useAntDesignDropdownFix();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="change-password" onClick={handleChangePassword}>
        🔑 Change Password
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        🚪 Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '6px 12px', 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img 
            src="/assets/cdac-logo.png" 
            alt="CDAC Logo" 
            style={{ height: '32px', width: 'auto' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/home')}
            >
              🏠 Home
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/business-dashboard')}
            >
              💼 Business
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/projects-dashboard')}
            >
              📋 Projects
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/finance-dashboard-new')}
            >
              💰 Finance
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/acts-view')}
            >
              🎓 ACTS
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/mmg-view')}
            >
              📦 MMG
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500', color: '#1890ff' }}
              onClick={() => navigate('/ed/admin-view')}
            >
              ⚙️ Admin
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/hr-view')}
            >
              👥 HR
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/calendar-view')}
            >
              📅 Calendar
            </Button>
            <Button 
              type="text" 
              style={{ fontWeight: '500' }}
              onClick={() => navigate('/ed/travel-view')}
            >
              ✈️ Travel
            </Button>
          </div>
        </div>
        <Dropdown 
          overlay={userMenu} 
          placement="bottomLeft"
          trigger={['click']}
          getPopupContainer={() => document.body}
          overlayStyle={{ minWidth: 160, right: 0, left: 'auto' }}
        >
          <Button 
            type="text"
            style={{ fontSize: '18px', padding: '4px 8px', cursor: 'pointer', marginLeft: '4px' }}
          >
            👤
          </Button>
        </Dropdown>
      </div>

      {/* Content */}
      <div style={{ padding: '0 24px' }}>
        <Tabs defaultActiveKey="dashboard" onChange={(key) => setActiveTab(key)}>
          <TabPane tab="Dashboard" key="dashboard">
            <AdminDashboard />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminViewPage; 