import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Tag, Input, Space } from 'antd';
import api from '../../../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

interface FinanceProject {
  project_id: number;
  project_name: string;
  technical_group_name: string;
  start_date: string;
  end_date: string;
  total_value: string | number;
  funding_agency?: string;
  created_date: string;
  updated_date: string;
}

const ProjectsTab: React.FC = () => {
  const [projects, setProjects] = useState<FinanceProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<FinanceProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search text
    const filtered = projects.filter(project =>
      (project.project_name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (project.technical_group_name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (project.funding_agency?.toLowerCase() || '').includes(searchText.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [projects, searchText]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/finance/projects');
      console.log('API Response:', response.data);
      console.log('First project sample:', response.data[0]);
      setProjects(response.data);
      setFilteredProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatus = (endDate: string): string => {
    const end = dayjs(endDate);
    const now = dayjs();
    return end.isBefore(now) ? 'Completed' : 'Ongoing';
  };

  const getStatusColor = (status: string): string => {
    return status === 'Completed' ? 'green' : 'blue';
  };

  const getBudgetUtilization = (budget: number, spent: number): number => {
    if (!budget || budget === 0) return 0;
    return (spent / budget) * 100;
  };

  const getTotalBudget = (): number => {
    return projects.reduce((sum, project) => sum + (parseFloat(String(project.total_value)) || 0), 0);
  };

  const getTotalSpent = (): number => {
    return projects.reduce((sum, project) => sum + (parseFloat(String(project.total_value)) || 0), 0);
  };

  const getCompletedProjects = (): number => {
    return projects.filter(project => getProjectStatus(project.end_date) === 'Completed').length;
  };

  const getOngoingProjects = (): number => {
    return projects.filter(project => getProjectStatus(project.end_date) === 'Ongoing').length;
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
      fixed: 'left' as const,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: FinanceProject) => {
        const status = getProjectStatus(record.end_date);
        return (
          <Tag color={getStatusColor(status)}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 100,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 100,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Project Value (₹)',
      dataIndex: 'total_value',
      key: 'total_value',
      width: 120,
      render: (amount: string | number) => `${parseFloat(String(amount))?.toLocaleString() || 0}`,
    },
    {
      title: 'Funding Agency',
      dataIndex: 'funding_agency',
      key: 'funding_agency',
      width: 150,
    },
    {
      title: 'Group',
      dataIndex: 'technical_group_name',
      key: 'technical_group_name',
      width: 120,
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Projects Table with Search */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="end">
            <Col>
              <Search
                placeholder="Search projects, groups, funding agencies..."
                allowClear
                size="large"
                style={{ width: 400 }}
                onSearch={handleSearch}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="project_id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
          summary={(pageData) => {
            const totalValue = pageData.reduce((sum, record) => {
              const value = parseFloat(String(record.total_value)) || 0;
              return sum + value;
            }, 0);
            return (
              <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0} colSpan={6}>
                  <Text strong>Total Project Value:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <Text strong style={{ color: '#1890ff' }}>
                    ₹{totalValue.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default ProjectsTab; 