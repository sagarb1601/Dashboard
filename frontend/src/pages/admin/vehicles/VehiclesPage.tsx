import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import VehiclesTab from './VehiclesTab';
import InsuranceTab from './InsuranceTab';
import ServicingTab from './ServicingTab';

const { TabPane } = Tabs;

const VehiclesPage: React.FC = () => {
  const [activeKey, setActiveKey] = useState('1');

  return (
    <Card>
      <Tabs activeKey={activeKey} onChange={setActiveKey}>
        <TabPane tab="Vehicles" key="1">
          <VehiclesTab />
        </TabPane>
        <TabPane tab="Insurance" key="2">
          <InsuranceTab />
        </TabPane>
        <TabPane tab="Servicing" key="3">
          <ServicingTab />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default VehiclesPage; 