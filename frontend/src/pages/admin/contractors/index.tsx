import React from 'react';
import { Tabs } from 'antd';
import ContractorsTab from './ContractorsTab';
import MappingTab from './MappingTab';

const { TabPane } = Tabs;

const ContractorsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Contractor Management</h1>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Add Contractor" key="1">
          <ContractorsTab />
        </TabPane>
        <TabPane tab="Department Mapping" key="2">
          <MappingTab />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ContractorsPage; 