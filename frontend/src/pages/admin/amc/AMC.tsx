import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import Providers from './Providers';
import AMCMapping from './AMCMapping';

const AMC: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <Card title="Annual Maintenance Contract (AMC) Management">
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        type="card"
      >
        <Tabs.TabPane tab="AMC Providers" key="1">
          <Providers key={activeTab} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Equipment Mapping" key="2">
          <AMCMapping key={activeTab} />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default AMC; 