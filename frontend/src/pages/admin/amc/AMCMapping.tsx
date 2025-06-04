import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Select,
  DatePicker
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api, { amcContracts } from '../../../utils/api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface Equipment {
  equipment_id: number;
  equipment_name: string;
}

interface Provider {
  amcprovider_id: number;
  amcprovider_name: string;
}

interface AMCMapping {
  amccontract_id: number;
  equipment_id: number;
  amcprovider_id: number;
  start_date: string;
  end_date: string;
  amc_value: number;
  remarks: string;
  equipment_name: string;
  amcprovider_name: string;
  created_at: string;
}

const EQUIPMENT_TYPES = [
  'AC',
  'Water Purifier',
  'CCTV',
  'UPS',
  'Elevator',
  'Fire Alarm',
  'Generator',
  'Diesel Set',
  'Printer'
];

const AMCMappingComponent: React.FC = () => {
  const [mappings, setMappings] = useState<AMCMapping[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMapping, setEditingMapping] = useState<AMCMapping | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      console.log('Fetching AMC data...');
      const [providersRes, mappingsRes, equipmentsRes] = await Promise.all([
        api.get('/amc/providers'),
        amcContracts.getAll(),
        api.get('/amc/equipments')
      ]);

      console.log('Providers data:', providersRes.data);
      console.log('Mappings data:', mappingsRes.data);
      console.log('Equipments data:', equipmentsRes.data);

      if (Array.isArray(providersRes.data)) setProviders(providersRes.data);
      if (Array.isArray(mappingsRes.data)) setMappings(mappingsRes.data);
      if (Array.isArray(equipmentsRes.data)) setEquipments(equipmentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingMapping(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: AMCMapping) => {
    setEditingMapping(record);
    form.setFieldsValue({
      ...record,
      contract_period: [dayjs(record.start_date), dayjs(record.end_date)]
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      console.log('Delete request starting for contract:', id);
      
      const response = await amcContracts.delete(id);
      console.log('Delete API response:', response);
      
      if (response.status === 200) {
        await fetchData(); // Refresh the data after successful deletion
        return true;
      }
      
      throw new Error(response.data?.message || 'Failed to delete contract');
    } catch (error: any) {
      console.error('Delete operation error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to delete contract';
      message.error(errorMessage);
      return false;
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const [startDate, endDate] = values.contract_period;
      const data = {
        equipment_id: values.equipment_id,
        amcprovider_id: values.amcprovider_id,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        amc_value: parseFloat(values.amc_value),
        remarks: values.remarks || ''
      };

      console.log('Submitting data:', data);

      if (editingMapping) {
        await amcContracts.update(editingMapping.amccontract_id, data);
        message.success('Mapping updated successfully');
      } else {
        await amcContracts.create(data);
        message.success('Mapping added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Failed to save mapping:', error);
      message.error('Failed to save mapping');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<AMCMapping> = [
    {
      title: 'Equipment',
      dataIndex: 'equipment_name',
      key: 'equipment_name',
      sorter: (a, b) => a.equipment_name.localeCompare(b.equipment_name),
    },
    {
      title: 'Provider',
      dataIndex: 'amcprovider_name',
      key: 'amcprovider_name',
      sorter: (a, b) => a.amcprovider_name.localeCompare(b.amcprovider_name),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'AMC Value',
      dataIndex: 'amc_value',
      key: 'amc_value',
      render: (value: number) => `₹${value.toLocaleString()}`,
      sorter: (a, b) => a.amc_value - b.amc_value,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: AMCMapping) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              console.log('Delete button clicked for record:', record);
              Modal.confirm({
                title: 'Delete Contract',
                content: `Are you sure you want to delete the contract for ${record.equipment_name} with ${record.amcprovider_name}?`,
                okText: 'Yes, Delete',
                okType: 'danger',
                cancelText: 'No, Cancel',
                onOk: () => {
                  console.log('Delete confirmation clicked for contract ID:', record.amccontract_id);
                  message.loading({ content: 'Deleting contract...', key: 'deleteLoading' });
                  return handleDelete(record.amccontract_id)
                    .then(success => {
                      console.log('Delete operation result:', success);
                      if (success) {
                        message.success('Contract deleted successfully');
                      }
                      return success;
                    })
                    .catch(error => {
                      console.error('Error in delete operation:', error);
                      message.error('Failed to delete contract');
                      return false;
                    })
                    .finally(() => {
                      console.log('Delete operation completed');
                      message.destroy('deleteLoading');
                    });
                },
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
        Add Equipment Mapping
      </Button>

      <Table
        columns={columns}
        dataSource={mappings}
        rowKey="amccontract_id"
      />

      <Modal
        title={editingMapping ? 'Edit Equipment Mapping' : 'Add Equipment Mapping'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="equipment_id"
            label="Equipment"
            rules={[{ required: true, message: 'Please select equipment' }]}
          >
            <Select placeholder="Select equipment">
              {equipments.map(equipment => (
                <Select.Option 
                  key={equipment.equipment_id} 
                  value={equipment.equipment_id}
                >
                  {equipment.equipment_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amcprovider_id"
            label="AMC Provider"
            rules={[{ required: true, message: 'Please select provider' }]}
          >
            <Select placeholder="Select provider">
              {providers.map(provider => (
                <Select.Option 
                  key={provider.amcprovider_id} 
                  value={provider.amcprovider_id}
                >
                  {provider.amcprovider_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="contract_period"
            label="Contract Period"
            rules={[{ required: true, message: 'Please select contract period' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="amc_value"
            label="AMC Value"
            rules={[
              { required: true, message: 'Please enter AMC value' },
              { 
                validator: async (_, value) => {
                  const numValue = parseFloat(value);
                  if (isNaN(numValue) || numValue <= 0) {
                    throw new Error('Value must be greater than 0');
                  }
                }
              }
            ]}
          >
            <Input type="number" prefix="₹" min="0" step="0.01" />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingMapping ? 'Update' : 'Add'}
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

export default AMCMappingComponent; 