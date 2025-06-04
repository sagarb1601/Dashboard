import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Table, Space, Modal } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { IconWrapper } from '../../../utils/IconWrapper';
import { contractors } from '../../../utils/api';
import { Contractor, contractorSchema } from '../../../types/contractor';
import type { TableProps } from 'antd/es/table';

const WrappedEditIcon = IconWrapper(EditOutlined);
const WrappedPlusIcon = IconWrapper(PlusOutlined);

const ContractorsTab: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [contractorsList, setContractorsList] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const { data } = await contractors.getAll();
      setContractorsList(data);
    } catch (error) {
      message.error('Failed to load contractors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const showModal = (contractor?: Contractor) => {
    form.resetFields();
    if (contractor) {
      setEditingContractor(contractor);
      form.setFieldsValue(contractor);
    } else {
      setEditingContractor(null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingContractor(null);
  };

  const onFinish = async (values: any) => {
    try {
      // Validate the data against our schema
      await contractorSchema.validate(values, { abortEarly: false });
      
      setSubmitting(true);
      if (editingContractor) {
        await contractors.update(editingContractor.contractor_id, values);
        message.success('Contractor updated successfully');
      } else {
        await contractors.create(values);
        message.success('Contractor added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingContractor(null);
      fetchContractors(); // Refresh the table
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        message.error(error.errors[0]);
      } else {
        message.error(editingContractor ? 'Failed to update contractor' : 'Failed to add contractor');
        console.error('Error:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contractorId: number) => {
    try {
      console.log('Deleting contractor:', contractorId);
      await contractors.delete(contractorId);
      message.success('Contractor deleted successfully');
      console.log('Contractor deleted, fetching updated list...');
      await fetchContractors();
      console.log('Updated contractors list:', contractorsList);
    } catch (error) {
      console.error('Error deleting contractor:', error);
      message.error('Failed to delete contractor');
    }
  };

  const columns: TableProps<Contractor>['columns'] = [
    {
      title: 'Company Name',
      dataIndex: 'contractor_company_name',
      key: 'contractor_company_name',
      sorter: (a, b) => a.contractor_company_name.localeCompare(b.contractor_company_name),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      sorter: (a, b) => a.contact_person.localeCompare(b.contact_person),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => showModal(record)}>
            <WrappedEditIcon /> Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.contractor_id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Contractors Management</h1>
        <Button 
          type="primary" 
          icon={<WrappedPlusIcon />}
          onClick={() => showModal()}
        >
          Add Contractor
        </Button>
      </div>

      <Card className="shadow">
        <Table
          columns={columns}
          dataSource={contractorsList}
          rowKey="contractor_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} contractors`,
          }}
        />
      </Card>

      <Modal
        title={editingContractor ? "Edit Contractor" : "Add New Contractor"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="contractor_company_name"
            label="Company Name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            name="contact_person"
            label="Contact Person"
            rules={[{ required: true, message: 'Please enter contact person' }]}
          >
            <Input placeholder="Enter contact person name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
              >
                {editingContractor ? 'Update Contractor' : 'Add Contractor'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractorsTab; 