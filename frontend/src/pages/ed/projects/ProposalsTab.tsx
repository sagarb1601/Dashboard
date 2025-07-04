import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Spin, Alert, Tag, Space, Button, Modal, Timeline } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Proposal {
  id: number;
  title: string;
  type: string;
  funding_agency: string;
  budget: number | null;
  status: string;
  submission_date: string | null;
  approval_date: string | null;
  rejection_date: string | null;
  created_at: string;
}

interface StatusHistory {
  old_status: string;
  new_status: string;
  update_date: string;
  remarks?: string;
}

const ProposalsTab: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/edoffice/dashboard/proposals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to load proposals data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async (proposalId: number) => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/edoffice/dashboard/proposal-status-history/${proposalId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatusHistory(data);
      } else {
        setStatusHistory([]);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
      setStatusHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const showStatusHistory = async (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setStatusModalVisible(true);
    await fetchStatusHistory(proposal.id);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'green';
      case 'submitted':
        return 'blue';
      case 'under review':
        return 'orange';
      case 'rejected':
        return 'red';
      case 'draft':
        return 'gray';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Proposal Title',
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
      width: 200,
    },
    {
      title: 'Proposal Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string | null) => type || 'N/A',
      width: 120,
    },
    {
      title: 'Funding Agency',
      dataIndex: 'funding_agency',
      key: 'funding_agency',
      render: (agency: string | null) => agency || 'N/A',
      width: 120,
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget: number | null) => budget ? `₹${budget.toLocaleString()}` : 'N/A',
      width: 100,
    },
    {
      title: 'Submission Date',
      dataIndex: 'submission_date',
      key: 'submission_date',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'N/A',
      width: 100,
    },
    {
      title: 'Approval Date',
      dataIndex: 'approval_date',
      key: 'approval_date',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'N/A',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string | null, record: Proposal) => (
        <Space>
          <Tag color={getStatusColor(status || '')}>
            {status || 'N/A'}
          </Tag>
          <Button 
            type="link" 
            size="small" 
            icon={<HistoryOutlined onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}} />}
            onClick={() => showStatusHistory(record)}
          >
            View History
          </Button>
        </Space>
      ),
      width: 150,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading proposals...</div>
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
          dataSource={proposals}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} proposals`,
          }}
        />
      </Card>

      <Modal
        visible={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProposal && (
          <>
            <Title level={3} style={{ marginBottom: '24px' }}>
              Status History for {selectedProposal.title}
            </Title>
            <Timeline>
              {statusHistory.map((history, index) => (
                <Timeline.Item key={index}>
                  <Text strong>{history.old_status} → {history.new_status}</Text>
                  <br />
                  <Text type="secondary">{new Date(history.update_date).toLocaleDateString()}</Text>
                  {history.remarks && (
                    <>
                      <br />
                      <Text>{history.remarks}</Text>
                    </>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ProposalsTab; 