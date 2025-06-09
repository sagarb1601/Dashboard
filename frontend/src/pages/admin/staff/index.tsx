import React from 'react';
import { Tabs } from 'antd';
import StaffTab from './StaffTab';
import StaffSalaries from './StaffSalaries';
import { SalaryProvider } from '../../../contexts/SalaryContext';

const { TabPane } = Tabs;

const StaffPage: React.FC = () => {
  return (
    <SalaryProvider>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Staff Management</h1>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Staff List" key="1">
            <StaffTab />
          </TabPane>
          <TabPane tab="Salary Management" key="2">
            <StaffSalaries />
          </TabPane>
        </Tabs>
      </div>
    </SalaryProvider>
  );
};

export default StaffPage; 