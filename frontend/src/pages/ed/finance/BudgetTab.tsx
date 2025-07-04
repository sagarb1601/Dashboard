import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Table, Spin, Alert, Typography, Space, Button, Modal, Form, Input, DatePicker, message } from 'antd';
import api from '../../../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Project {
  project_id: number;
  project_name: string;
}

interface BudgetField {
  field_id: number;
  field_name: string;
  total_grant_received?: number;
  latest_grant_received?: number;
  grant_received?: number;
}

interface BudgetEntry {
  field_id: number;
  year_number: number;
  amount: number;
}

const BudgetTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBudgetFields(selectedProject);
      fetchBudgetEntries(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/finance/projects');
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].project_id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchBudgetFields = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/budget-fields/${projectId}`);
      setBudgetFields(response.data);
    } catch (error) {
      console.error('Error fetching budget fields:', error);
    }
  };

  const fetchBudgetEntries = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/budget-entries/${projectId}`);
      setBudgetEntries(response.data);
    } catch (error) {
      console.error('Error fetching budget entries:', error);
    }
  };

  const handleProjectChange = async (value: number) => {
    setSelectedProject(value);
  };

  const getBudgetYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  };

  const getBudgetAmount = (fieldId: number, yearNumber: number): number => {
    const entry = budgetEntries.find(entry => entry.field_id === fieldId && entry.year_number === yearNumber);
    return entry ? entry.amount : 0;
  };

  const getFieldTotalBudget = (fieldId: number): number => {
    return budgetEntries
      .filter(entry => entry.field_id === fieldId)
      .reduce((sum, entry) => sum + entry.amount, 0);
  };

  const columns = [
    {
      title: 'Budget Field',
      dataIndex: 'field_name',
      key: 'field_name',
      width: 200,
    },
    ...getBudgetYears().map(year => ({
      title: `${year}-${year + 1}`,
      key: year,
      dataIndex: year,
      width: 120,
      render: (_: any, record: BudgetField) => (
        <div style={{ textAlign: 'right' }}>
          ₹{getBudgetAmount(record.field_id, year).toLocaleString()}
        </div>
      ),
    })),
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_: any, record: BudgetField) => (
        <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
          ₹{getFieldTotalBudget(record.field_id).toLocaleString()}
        </div>
      ),
    },
  ];

  const dataSource = budgetFields.map(field => ({
    ...field,
    key: field.field_id,
  }));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>Budget Management</Title>
        <Text type="secondary">Manage budget allocations and track financial planning</Text>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Text strong>Select Project:</Text>
          </Col>
          <Col>
            <Select
              style={{ width: 300 }}
              value={selectedProject}
              onChange={handleProjectChange}
              placeholder="Select a project"
            >
              {projects.map(project => (
                <Option key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {selectedProject && (
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>Budget Allocation</Title>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  onClick={() => {
                    setEditingEntry(null);
                    setIsModalVisible(true);
                  }}
                >
                  Add Budget Entry
                </Button>
              </Col>
            </Row>
          </div>

          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            scroll={{ x: 'max-content' }}
            loading={loading}
          />
        </Card>
      )}

      {/* Summary Statistics */}
      {selectedProject && (
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Budget Fields"
                value={budgetFields.length}
                prefix="📊"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Budget Allocated"
                value={budgetFields.reduce((sum, field) => sum + getFieldTotalBudget(field.field_id), 0)}
                prefix="₹"
                formatter={(value) => value?.toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Average per Field"
                value={budgetFields.length > 0 ? budgetFields.reduce((sum, field) => sum + getFieldTotalBudget(field.field_id), 0) / budgetFields.length : 0}
                prefix="₹"
                formatter={(value) => value?.toLocaleString()}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default BudgetTab; 