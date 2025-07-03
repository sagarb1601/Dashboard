import React, { useState, useEffect } from 'react';
import { Table, Card, message, Tag, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface BusinessEntity {
  id: number;
  name: string;
  entity_type: string;
  service_type?: string;
  client_name: string;
  start_date: string;
  end_date: string;
  order_value: number;
  payment_duration: string;
  description?: string;
}

const BusinessEntitiesTab: React.FC = () => {
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchBusinessEntities();
  }, []);

  const fetchBusinessEntities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/business-entities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEntities(data);
      } else {
        message.error('Failed to fetch business entities');
      }
    } catch (error) {
      console.error('Error fetching business entities:', error);
      message.error('Failed to fetch business entities');
    } finally {
      setLoading(false);
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'product': return 'blue';
      case 'service': return 'green';
      case 'project': return 'purple';
      default: return 'default';
    }
  };

  const columns: ColumnsType<BusinessEntity> = [
    {
      title: 'Entity Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      sorter: (a, b) => a.client_name.localeCompare(b.client_name),
    },
    {
      title: 'Entity Type',
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (type) => (
        <Tag color={getEntityTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Product', value: 'product' },
        { text: 'Service', value: 'service' },
        { text: 'Project', value: 'project' },
      ],
      onFilter: (value, record) => record.entity_type === value,
    },
    {
      title: 'Service Type',
      dataIndex: 'service_type',
      key: 'service_type',
      render: (type) => type ? type.toUpperCase() : '-',
    },
    {
      title: 'Order Value (₹)',
      dataIndex: 'order_value',
      key: 'order_value',
      sorter: (a, b) => a.order_value - b.order_value,
      render: (value) => value.toLocaleString(),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchText.toLowerCase()) ||
    entity.client_name.toLowerCase().includes(searchText.toLowerCase()) ||
    entity.entity_type.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '12px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Business Entities ({filteredEntities.length})</h3>
          <Search
            placeholder="Search entities..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredEntities}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} entities`,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default BusinessEntitiesTab; 