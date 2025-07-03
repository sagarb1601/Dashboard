import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, Space, Card, message, DatePicker, Row, Col } from 'antd';
import { api } from '../../services/api';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

interface CreateProcurementFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Project {
  project_id: number;
  project_name: string;
}

interface TechnicalGroup {
  group_id: number;
  group_name: string;
}

const CreateProcurementForm: React.FC<CreateProcurementFormProps> = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<TechnicalGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  
  // Fetch projects from the database
  useEffect(() => {
    fetchProjects();
    fetchTechnicalGroups();
  }, []);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await api.get('/finance/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      message.error('Failed to fetch projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchTechnicalGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await api.get('/hr/technical_groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch technical groups:', error);
      message.error('Failed to fetch technical groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      if (!values.items || values.items.length === 0) {
        message.error('Please add at least one item');
        return;
      }
      
      const formData = {
        ...values,
        indent_date: values.indent_date ? values.indent_date.format('YYYY-MM-DD') : undefined,
        mmg_acceptance_date: values.mmg_acceptance_date ? values.mmg_acceptance_date.format('YYYY-MM-DD') : undefined
      };
      
      console.log('Submitting payload:', formData);
      await api.post('/mmg/procurements', formData);
      message.success('Procurement Indent Created Successfully!');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Error creating procurement:', error);
      message.error('Failed to create procurement indent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="indent_number" label="Indent Number" rules={[{ required: true, message: 'Please enter indent number' }]}>
            <Input placeholder="Enter indent number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="title" label="Indent Title" rules={[{ required: true, message: 'Please enter indent title' }]}>
            <Input placeholder="Enter indent title" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="project_id" label="Project" rules={[{ required: true, message: 'Please select project' }]}>
            <Select placeholder="Select project" loading={projectsLoading}>
              {projects.map(project => (
                <Option key={project.project_id} value={project.project_id}>{project.project_name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="group_id" label="Technical Group" rules={[{ required: true, message: 'Please select technical group' }]}>
            <Select placeholder="Select technical group" loading={groupsLoading}>
              {groups.map(group => (
                <Option key={group.group_id} value={group.group_id}>{group.group_name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="purchase_type" label="Purchase Type" rules={[{ required: true, message: 'Please select purchase type' }]}>
            <Select placeholder="Select purchase type">
              <Option value="Consumables">Consumables</Option>
              <Option value="Capital Equipment">Capital Equipment</Option>
              <Option value="Stock & Sale">Stock & Sale</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="delivery_place" label="Delivery Place" rules={[{ required: true, message: 'Please select delivery place' }]}>
            <Select placeholder="Select delivery place">
              <Option value="CDAC KP">CDAC KP</Option>
              <Option value="CDAC EC1">CDAC EC1</Option>
              <Option value="CDAC EC2">CDAC EC2</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="estimated_cost" label="Estimated Cost" rules={[{ required: true, message: 'Please enter estimated cost' }]}>
            <InputNumber placeholder="e.g., 50000" style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="indent_date" label="Indent Date" rules={[{ required: true, message: 'Please select indent date' }]}>
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Select indent date"
              format="YYYY-MM-DD"
              defaultValue={moment()}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="mmg_acceptance_date" label="MMG Acceptance Date" rules={[{ required: true, message: 'Please select MMG acceptance date' }]}>
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Select MMG acceptance date"
              format="YYYY-MM-DD"
              defaultValue={moment()}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, 'item_name']}
                      rules={[{ required: true, message: 'Missing item name' }]}
                    >
                      <Input placeholder="Item name" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Missing quantity' }]}
                    >
                      <InputNumber placeholder="Qty" min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      {...restField}
                      name={[name, 'specifications']}
                    >
                      <TextArea placeholder="Specifications" rows={1} />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button type="text" danger onClick={() => remove(name)}>
                      Delete
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block>
                Add Item
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Procurement
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CreateProcurementForm; 