import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Card,
  Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../../utils/api';

interface Provider {
  amcprovider_id: number;
  amcprovider_name: string;
  contact_person_name: string;
  contact_number: string;
  email: string;
  address: string;
  hasContracts?: boolean;
}

export interface ProvidersRef {
  refresh: () => void;
}

const ProvidersComponent = forwardRef<ProvidersRef>((_, ref) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchProviders = async () => {
    try {
      console.log('Fetching providers...');
      // First get all providers
      const providersResponse = await api.get('/amc/providers');
      
      // Then get all contracts to check which providers have mappings
      const contractsResponse = await api.get('/amc/contracts');
      
      if (Array.isArray(providersResponse.data)) {
        const providerIds = new Set(contractsResponse.data.map((contract: any) => contract.amcprovider_id));
        
        const providersWithContractInfo = providersResponse.data.map((provider: Provider) => ({
          ...provider,
          hasContracts: providerIds.has(provider.amcprovider_id)
        }));
        
        setProviders(providersWithContractInfo);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      message.error('Failed to fetch AMC providers');
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchProviders
  }));

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleAdd = () => {
    console.log('Add button clicked');
    setEditingProvider(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Provider) => {
    console.log('Edit button clicked for record:', record);
    setEditingProvider(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      console.log('Deleting provider:', id);
      await api.delete(`/amc/providers/${id}`);
      message.success('Provider deleted successfully');
      fetchProviders();
    } catch (error: any) {
      console.error('Failed to delete provider:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete provider';
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingProvider) {
        await api.put(
          `/amc/providers/${editingProvider.amcprovider_id}`,
          values
        );
        message.success('AMC provider updated successfully');
      } else {
        await api.post('/amc/providers', values);
        message.success('AMC provider added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchProviders();
    } catch (error) {
      console.error('Failed to save provider:', error);
      message.error('Failed to save AMC provider');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Provider> = [
    {
      title: 'Provider Name',
      dataIndex: 'amcprovider_name',
      key: 'amcprovider_name',
      sorter: (a, b) => a.amcprovider_name.localeCompare(b.amcprovider_name),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person_name',
      key: 'contact_person_name',
    },
    {
      title: 'Contact Number',
      dataIndex: 'contact_number',
      key: 'contact_number',
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
      render: (_, record: Provider) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Tooltip title={record.hasContracts ? 
            "Cannot delete provider with existing contracts. Please delete all associated contracts first." : 
            "Delete this provider"}>
            <Button
              type="link"
              danger
              disabled={record.hasContracts}
              onClick={() => {
                if (!record.hasContracts) {
                  Modal.confirm({
                    title: 'Delete Provider',
                    content: 'Are you sure you want to delete this provider? This action cannot be undone.',
                    okText: 'Yes, Delete',
                    okType: 'danger',
                    cancelText: 'No, Cancel',
                    onOk: () => handleDelete(record.amcprovider_id)
                  });
                }
              }}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card title="AMC Providers">
      <Button
        type="primary"
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Add Provider
      </Button>

      <Table
        columns={columns}
        dataSource={providers}
        rowKey="amcprovider_id"
        scroll={{ x: true }}
      />

      <Modal
        title={editingProvider ? 'Edit AMC Provider' : 'Add AMC Provider'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="amcprovider_name"
            label="Provider Name"
            rules={[{ required: true, message: 'Please enter provider name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="contact_person_name"
            label="Contact Person Name"
            rules={[{ required: true, message: 'Please enter contact person name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="contact_number"
            label="Contact Number"
            rules={[
              { required: true, message: 'Please enter contact number' },
              { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit number' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProvider ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
});

export default ProvidersComponent; 