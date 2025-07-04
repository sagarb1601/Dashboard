import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Spin, Alert, Tag, Space } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Patent {
  id: number;
  title: string;
  application_number: string;
  status: string;
  filing_date: string;
  grant_date: string | null;
  rejection_date: string | null;
  inventors: string | null;
  created_at: string;
}

const PatentsTab: React.FC = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatents();
  }, []);

  const fetchPatents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/edoffice/dashboard/patents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patents');
      }

      const data = await response.json();
      setPatents(data);
    } catch (err) {
      console.error('Error fetching patents:', err);
      setError('Failed to load patents data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'granted':
        return 'green';
      case 'pending':
        return 'orange';
      case 'published':
        return 'blue';
      case 'abandoned':
        return 'red';
      case 'expired':
        return 'gray';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Patent Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string | null) => (
        <div style={{ 
          whiteSpace: 'normal', 
          wordWrap: 'break-word',
          lineHeight: '1.4'
        }}>
          {title || 'N/A'}
        </div>
      ),
      width: 250,
    },
    {
      title: 'Application Number',
      dataIndex: 'application_number',
      key: 'application_number',
      render: (number: string | null) => number || 'N/A',
      width: 150,
    },
    {
      title: 'Inventors',
      dataIndex: 'inventors',
      key: 'inventors',
      render: (inventors: string | null) => inventors || 'N/A',
      width: 150,
    },
    {
      title: 'Filing Date',
      dataIndex: 'filing_date',
      key: 'filing_date',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'N/A',
      width: 120,
    },
    {
      title: 'Grant Date',
      dataIndex: 'grant_date',
      key: 'grant_date',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'N/A',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string | null) => status || 'N/A',
      width: 120,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading patents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Table
          columns={columns}
          dataSource={patents}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} patents`,
          }}
        />
      </Card>
    </div>
  );
};

export default PatentsTab; 