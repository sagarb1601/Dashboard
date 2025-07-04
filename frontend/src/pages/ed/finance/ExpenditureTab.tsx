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

interface Expenditure {
  expenditure_id: number;
  field_id: number;
  expenditure_date: string;
  amount_spent: number;
  description?: string;
}

const ExpenditureTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState<Expenditure | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBudgetFields(selectedProject);
      fetchExpenditures(selectedProject);
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

  const fetchExpenditures = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/expenditures/${projectId}`);
      setExpenditures(response.data);
    } catch (error) {
      console.error('Error fetching expenditures:', error);
    }
  };

  const handleProjectChange = async (value: number) => {
    setSelectedProject(value);
  };

  const getTotalExpenditure = (): number => {
    return expenditures.reduce((sum, exp) => sum + exp.amount_spent, 0);
  };

  const getExpenditureByField = (fieldId: number): number => {
    return expenditures
      .filter(exp => exp.field_id === fieldId)
      .reduce((sum, exp) => sum + exp.amount_spent, 0);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'expenditure_date',
      key: 'expenditure_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Budget Field',
      key: 'field_name',
      render: (_: any, record: Expenditure) => {
        const field = budgetFields.find(f => f.field_id === record.field_id);
        return field?.field_name || 'Unknown';
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount_spent',
      key: 'amount_spent',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Expenditure) => (
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
            onClick={() => handleDelete(record.expenditure_id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (expenditure: Expenditure) => {
    setEditingExpenditure(expenditure);
    form.setFieldsValue({
      field_id: expenditure.field_id,
      expenditure_date: dayjs(expenditure.expenditure_date),
      amount_spent: expenditure.amount_spent,
      description: expenditure.description,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (expenditureId: number) => {
    try {
      await api.delete(`/finance/expenditures/${expenditureId}`);
      message.success('Expenditure deleted successfully');
      if (selectedProject) {
        fetchExpenditures(selectedProject);
      }
    } catch (error) {
      message.error('Failed to delete expenditure');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        expenditure_date: values.expenditure_date.format('YYYY-MM-DD'),
      };

      if (editingExpenditure) {
        await api.put(`/finance/expenditures/${editingExpenditure.expenditure_id}`, data);
        message.success('Expenditure updated successfully');
      } else {
        await api.post('/finance/expenditures', data);
        message.success('Expenditure added successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      if (selectedProject) {
        fetchExpenditures(selectedProject);
      }
    } catch (error) {
      message.error('Failed to save expenditure');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>Expenditure Tracking</Title>
        <Text type="secondary">Track and manage project expenditures</Text>
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
                  <Title level={4}>Expenditure Records</Title>
                </Col>
                <Col>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      setEditingExpenditure(null);
                      form.resetFields();
                      setIsModalVisible(true);
                    }}
                  >
                    Add Expenditure
                  </Button>
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={expenditures}
              rowKey="expenditure_id"
              loading={loading}
            />
          </Card>

          {/* Summary Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Expenditure"
                  value={getTotalExpenditure()}
                  prefix="₹"
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Records"
                  value={expenditures.length}
                  prefix="📊"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Average per Record"
                  value={expenditures.length > 0 ? getTotalExpenditure() / expenditures.length : 0}
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
        title={editingExpenditure ? 'Edit Expenditure' : 'Add Expenditure'}
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
            name="expenditure_date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="amount_spent"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <Input type="number" placeholder="Enter amount" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter description" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              {editingExpenditure ? 'Update' : 'Add'}
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

export default ExpenditureTab; 