import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

interface Equipment {
  equipment_id: number;
  equipment_name: string;
  created_at: string;
}

const EquipmentComponent: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchEquipments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/amc/equipments');
      if (Array.isArray(response.data)) {
        setEquipments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
      message.error('Failed to fetch equipment list');
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const handleAdd = () => {
    setEditingEquipment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Equipment) => {
    setEditingEquipment(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/amc/equipments/${id}`);
      message.success('Equipment deleted successfully');
      fetchEquipments();
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      message.error('Failed to delete equipment');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingEquipment) {
        await axios.put(
          `http://localhost:5000/api/amc/equipments/${editingEquipment.equipment_id}`,
          values
        );
        message.success('Equipment updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/amc/equipments', values);
        message.success('Equipment added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchEquipments();
    } catch (error) {
      console.error('Failed to save equipment:', error);
      message.error('Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Equipment> = [
    {
      title: 'Equipment Name',
      dataIndex: 'equipment_name',
      key: 'equipment_name',
      sorter: (a, b) => a.equipment_name.localeCompare(b.equipment_name),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Equipment) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure you want to delete this equipment?',
                content: 'This action cannot be undone.',
                onOk: () => handleDelete(record.equipment_id),
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Add Equipment
      </Button>

      <Table
        columns={columns}
        dataSource={equipments}
        rowKey="equipment_id"
      />

      <Modal
        title={editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
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
            name="equipment_name"
            label="Equipment Name"
            rules={[
              { required: true, message: 'Please enter equipment name' },
              { max: 100, message: 'Equipment name cannot exceed 100 characters' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingEquipment ? 'Update' : 'Add'}
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
    </>
  );
};

export default EquipmentComponent; 