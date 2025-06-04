import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import axios from 'axios';

interface ContractorFormData {
  contractor_company_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
}

const ContractorForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: ContractorFormData) => {
    setLoading(true);
    try {
      await axios.post('/api/admin/contractors', values);
      message.success('Contractor added successfully');
      form.resetFields();
    } catch (error) {
      message.error('Failed to add contractor');
      console.error('Error adding contractor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Add New Contractor">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Company Name"
          name="contractor_company_name"
          rules={[{ required: true, message: 'Please enter company name' }]}
        >
          <Input placeholder="Enter company name" />
        </Form.Item>

        <Form.Item
          label="Contact Person"
          name="contact_person"
          rules={[{ required: true, message: 'Please enter contact person' }]}
        >
          <Input placeholder="Enter contact person name" />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
          rules={[
            { required: true, message: 'Please enter phone number' },
            { pattern: /^[0-9-+()]{10,}$/, message: 'Please enter a valid phone number' }
          ]}
        >
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input type="email" placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          label="Address"
          name="address"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Enter complete address"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Add Contractor
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ContractorForm; 