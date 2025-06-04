import React from 'react';
import { Tabs } from 'antd';
import GroupTransfer from './GroupTransfer';
import Promotions from './Promotions';
import Attrition from './Attrition';
import ContractRenewal from './ContractRenewal';

const Services: React.FC = () => {
  const items = [
    {
      key: 'promotions',
      label: 'Promotions',
      children: <Promotions />
    },
    // Temporarily hiding Group Transfers
    // {
    //   key: 'group_transfers',
    //   label: 'Group Transfers',
    //   children: <GroupTransfer />
    // },
    {
      key: 'attrition',
      label: 'Attrition',
      children: <Attrition />
    },
    {
      key: 'contract_renewals',
      label: 'Contract Renewals',
      children: <ContractRenewal />
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs 
        items={items}
        defaultActiveKey="promotions"
        destroyInactiveTabPane
      />
    </div>
  );
};

export default Services;