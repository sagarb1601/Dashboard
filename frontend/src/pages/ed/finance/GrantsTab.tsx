import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Table, Typography, Button, DatePicker, Input, Form, Modal, message } from 'antd';
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
}

interface GrantReceived {
  grant_id: number;
  field_id: number;
  grant_date: string;
  amount_received: number;
  grant_source: string;
  description?: string;
}

const GrantsTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [grants, setGrants] = useState<GrantReceived[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGrant, setEditingGrant] = useState<GrantReceived | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBudgetFields(selectedProject);
      fetchGrants(selectedProject);
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

  const fetchGrants = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/grants/${projectId}`);
      setGrants(response.data);
    } catch (error) {
      console.error('Error fetching grants:', error);
    }
  };

  const handleProjectChange = async (value: number) => {
    setSelectedProject(value);
  };

  const getTotalGrants = (): number => {
    return grants.reduce((sum, grant) => sum + grant.amount_received, 0);
  };

  const getGrantsByField = (fieldId: number): number => {
    return grants
      .filter(grant => grant.field_id === fieldId)
      .reduce((sum, grant) => sum + grant.amount_received, 0);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'grant_date',
      key: 'grant_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Budget Field',
      key: 'field_name',
      render: (_: any, record: GrantReceived) => {
        const field = budgetFields.find(f => f.field_id === record.field_id);
        return field?.field_name || 'Unknown';
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount_received',
      key: 'amount_received',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Source',
      dataIndex: 'grant_source',
      key: 'grant_source',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: GrantReceived) => (
        <div>
          <Button 
            type="text" 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="text" 
            danger 
            onClick={() => handleDelete(record.grant_id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (grant: GrantReceived) => {
    setEditingGrant(grant);
    form.setFieldsValue({
      field_id: grant.field_id,
      grant_date: dayjs(grant.grant_date),
      amount_received: grant.amount_received,
      grant_source: grant.grant_source,
      description: grant.description,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (grantId: number) => {
    try {
      await api.delete(`/finance/grants/${grantId}`);
      message.success('Grant deleted successfully');
      if (selectedProject) {
        fetchGrants(selectedProject);
      }
    } catch (error) {
      message.error('Failed to delete grant');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        grant_date: values.grant_date.format('YYYY-MM-DD'),
      };

      if (editingGrant) {
        await api.put(`/finance/grants/${editingGrant.grant_id}`, data);
        message.success('Grant updated successfully');
      } else {
        await api.post('/finance/grants', data);
        message.success('Grant added successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      if (selectedProject) {
        fetchGrants(selectedProject);
      }
    } catch (error) {
      message.error('Failed to save grant');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>Grant Management</Title>
        <Text type="secondary">Track and manage grant receipts and funding sources</Text>
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
        <>
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4}>Grant Records</Title>
                </Col>
                <Col>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      setEditingGrant(null);
                      form.resetFields();
                      setIsModalVisible(true);
                    }}
                  >
                    Add Grant
                  </Button>
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={grants}
              rowKey="grant_id"
              loading={loading}
            />
          </Card>

          {/* Summary Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Grants Received"
                  value={getTotalGrants()}
                  prefix="₹"
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Records"
                  value={grants.length}
                  prefix="📊"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Average per Grant"
                  value={grants.length > 0 ? getTotalGrants() / grants.length : 0}
                  prefix="₹"
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingGrant ? 'Edit Grant' : 'Add Grant'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="field_id"
            label="Budget Field"
            rules={[{ required: true, message: 'Please select a budget field' }]}
          >
            <Select placeholder="Select budget field">
              {budgetFields.map(field => (
                <Option key={field.field_id} value={field.field_id}>
                  {field.field_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="grant_date"
            label="Grant Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="amount_received"
            label="Amount Received"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <Input type="number" placeholder="Enter amount" />
          </Form.Item>

          <Form.Item
            name="grant_source"
            label="Grant Source"
            rules={[{ required: true, message: 'Please enter grant source' }]}
          >
            <Input placeholder="Enter grant source" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter description" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              {editingGrant ? 'Update' : 'Add'}
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GrantsTab; 