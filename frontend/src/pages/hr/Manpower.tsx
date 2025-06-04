import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Space } from 'antd';
import api from '../../utils/api';

interface ManpowerCount {
  id: number;
  on_rolls: number;
  cocp: number;
  regular: number;
  cc: number;
  gbc: number;
  ka: number;
  spe: number;
  pe: number;
  pa: number;
  total_employees: number;
  created_at: string;
}

const Manpower: React.FC = () => {
  const [manpowerCounts, setManpowerCounts] = useState<ManpowerCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ManpowerCount | null>(null);
  const [form] = Form.useForm();

  const fetchManpowerCounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/manpower');
      setManpowerCounts(response.data);
    } catch (error) {
      message.error('Failed to fetch manpower counts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManpowerCounts();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: ManpowerCount) => {
    form.setFieldsValue(record);
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/manpower/${id}`);
      message.success('Manpower count deleted successfully');
      fetchManpowerCounts();
    } catch (error) {
      message.error('Failed to delete manpower count');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await api.put(`/manpower/${editingRecord.id}`, values);
        message.success('Manpower count updated successfully');
      } else {
        await api.post('/manpower', values);
        message.success('Manpower count added successfully');
      }
      setIsModalVisible(false);
      fetchManpowerCounts();
    } catch (error) {
      message.error('Failed to save manpower count');
    }
  };

  const columns = [
    {
      title: 'On Rolls',
      dataIndex: 'on_rolls',
      key: 'on_rolls',
    },
    {
      title: 'COCP',
      dataIndex: 'cocp',
      key: 'cocp',
    },
    {
      title: 'Regular',
      dataIndex: 'regular',
      key: 'regular',
    },
    {
      title: 'CC',
      dataIndex: 'cc',
      key: 'cc',
    },
    {
      title: 'GBC',
      dataIndex: 'gbc',
      key: 'gbc',
    },
    {
      title: 'KA',
      dataIndex: 'ka',
      key: 'ka',
    },
    {
      title: 'SPE',
      dataIndex: 'spe',
      key: 'spe',
    },
    {
      title: 'PE',
      dataIndex: 'pe',
      key: 'pe',
    },
    {
      title: 'PA',
      dataIndex: 'pa',
      key: 'pa',
    },
    {
      title: 'Total Employees',
      dataIndex: 'total_employees',
      key: 'total_employees',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ManpowerCount) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button type="primary" onClick={handleAdd}>
          Add New Count
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={manpowerCounts}
        loading={loading}
        rowKey="id"
        scroll={{ x: true }}
      />

      <Modal
        title={editingRecord ? "Edit Manpower Count" : "Add Manpower Count"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <Form.Item
              name="on_rolls"
              label="On Rolls"
              rules={[{ required: true, message: 'Please enter On Rolls count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="cocp"
              label="COCP"
              rules={[{ required: true, message: 'Please enter COCP count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="regular"
              label="Regular"
              rules={[{ required: true, message: 'Please enter Regular count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="cc"
              label="CC"
              rules={[{ required: true, message: 'Please enter CC count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="gbc"
              label="GBC"
              rules={[{ required: true, message: 'Please enter GBC count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="ka"
              label="KA"
              rules={[{ required: true, message: 'Please enter KA count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="spe"
              label="SPE"
              rules={[{ required: true, message: 'Please enter SPE count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="pe"
              label="PE"
              rules={[{ required: true, message: 'Please enter PE count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="pa"
              label="PA"
              rules={[{ required: true, message: 'Please enter PA count' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Manpower; 