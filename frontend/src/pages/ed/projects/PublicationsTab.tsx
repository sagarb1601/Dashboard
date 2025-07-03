import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Spin, Alert, Tag, Space, Divider } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Publication {
  id: number;
  title: string;
  type: string;
  details: string;
  publication_date: string;
  authors: string;
  doi: string;
  publication_scope: string;
  impact_factor: number | string | null;
  created_at: string;
}

const PublicationsTab: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/edoffice/dashboard/publications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch publications');
      }

      const data = await response.json();
      setPublications(data);
    } catch (err) {
      console.error('Error fetching publications:', err);
      setError('Failed to load publications data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const columns = [
    {
      title: 'Title of Publication',
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
      title: 'Publication Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string | null) => type || 'N/A',
      width: 120,
    },
    {
      title: 'Conference Description',
      dataIndex: 'details',
      key: 'details',
      render: (details: string | null) => (
        <div style={{ 
          whiteSpace: 'normal', 
          wordWrap: 'break-word',
          lineHeight: '1.4'
        }}>
          {details || 'N/A'}
        </div>
      ),
      width: 180,
    },
    {
      title: 'Date of Publication',
      dataIndex: 'publication_date',
      key: 'publication_date',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'N/A',
      width: 130,
    },
    {
      title: 'Authors',
      dataIndex: 'authors',
      key: 'authors',
      render: (authors: string | null) => (
        <div style={{ 
          whiteSpace: 'normal', 
          wordWrap: 'break-word',
          lineHeight: '1.4'
        }}>
          {authors || 'N/A'}
        </div>
      ),
      width: 180,
    },
    {
      title: 'DOI (Digital Object Identifier)',
      dataIndex: 'doi',
      key: 'doi',
      render: (doi: string | null) => doi || 'N/A',
      width: 180,
    },
    {
      title: 'Publication Scope',
      dataIndex: 'publication_scope',
      key: 'publication_scope',
      render: (scope: string | null) => scope || 'N/A',
      width: 120,
    },
    {
      title: 'Impact Factor / Ranking',
      dataIndex: 'impact_factor',
      key: 'impact_factor',
      render: (factor: number | string | null) => {
        if (factor === null || factor === undefined) return 'N/A';
        const numFactor = typeof factor === 'string' ? parseFloat(factor) : factor;
        return isNaN(numFactor) ? 'N/A' : numFactor.toFixed(2);
      },
      width: 140,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading publications...</div>
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
          dataSource={publications}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} publications`,
          }}
        />
      </Card>
    </div>
  );
};

export default PublicationsTab; 