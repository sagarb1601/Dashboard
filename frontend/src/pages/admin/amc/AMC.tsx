import React, { useState, useRef } from 'react';
import { Card, Tabs } from 'antd';
import Providers from './Providers';
import AMCMapping from './AMCMapping';

const AMC: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');
  const providersRef = useRef<{ refresh: () => void } | null>(null);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Refresh providers list when switching back to providers tab
    if (key === '1') {
      providersRef.current?.refresh();
    }
  };

  const handleMappingDeleted = () => {
    // Refresh providers list when a mapping is deleted
    providersRef.current?.refresh();
  };

  return (
    <Card title="Annual Maintenance Contract (AMC) Management">
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        type="card"
      >
        <Tabs.TabPane tab="AMC Providers" key="1">
          <Providers ref={providersRef} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Equipment Mapping" key="2">
          <AMCMapping onMappingDeleted={handleMappingDeleted} />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default AMC; 