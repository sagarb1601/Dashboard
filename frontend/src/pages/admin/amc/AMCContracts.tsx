import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Popconfirm,
  Card,
  Select,
  DatePicker
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

interface Equipment {
  equipment_id: number;
  equipment_name: string;
  created_at?: string;
}

interface AMCProvider {
  amcprovider_id: number;
  amcprovider_name: string;
}

interface AMCContract {
  amccontract_id: number;
  equipment_id: number;
  amcprovider_id: number;
  start_date: string;
  end_date: string;
  amc_value: number;
  remarks: string;
  equipment_name: string;
  amcprovider_name: string;
}

const AMCContracts: React.FC = () => {
  const [contracts, setContracts] = useState<AMCContract[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [providers, setProviders] = useState<AMCProvider[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<AMCContract | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      
      // Fetch equipment data first
      const equipmentsRes = await axios.get('http://localhost:5000/api/amc/equipments');
      console.log('Equipment data received:', equipmentsRes.data);
      
      if (Array.isArray(equipmentsRes.data)) {
        setEquipments(equipmentsRes.data);
      } else {
        console.error('Equipment data is not an array:', equipmentsRes.data);
        message.error('Failed to load equipment data');
        return;
      }

      // Then fetch providers
      const providersRes = await axios.get('http://localhost:5000/api/amc/providers');
      console.log('Providers data received:', providersRes.data);
      
      if (Array.isArray(providersRes.data)) {
        setProviders(providersRes.data);
      } else {
        console.error('Provider data is not an array:', providersRes.data);
        message.error('Failed to load provider data');
        return;
      }

      // Finally fetch contracts
      const contractsRes = await axios.get('http://localhost:5000/api/amc/contracts');
      if (Array.isArray(contractsRes.data)) {
        setContracts(contractsRes.data);
      } else {
        console.error('Contract data is not an array:', contractsRes.data);
        message.error('Failed to load contract data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
        console.error('Status:', error.response?.status);
      }
      message.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Current equipment state:', equipments);
    console.log('Current providers state:', providers);
  }, [equipments, providers]);

  const handleAdd = () => {
    setEditingContract(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: AMCContract) => {
    setEditingContract(record);
    form.setFieldsValue({
      ...record,
      contract_period: [dayjs(record.start_date), dayjs(record.end_date)]
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/amc/contracts/${id}`);
      message.success('AMC contract deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete AMC contract');
    }
  };

  const handleSubmit = async (values: any) => {
    const [start_date, end_date] = values.contract_period.map((date: Dayjs) => 
      date.format('YYYY-MM-DD')
    );

    const submitData = {
      ...values,
      start_date,
      end_date
    };
    delete submitData.contract_period;

    setLoading(true);
    try {
      if (editingContract) {
        await axios.put(
          `http://localhost:5000/api/amc/contracts/${editingContract.amccontract_id}`,
          submitData
        );
        message.success('AMC contract updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/amc/contracts', submitData);
        message.success('AMC contract added successfully');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Failed to save AMC contract');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<AMCContract> = [
    {
      title: 'Equipment',
      dataIndex: 'equipment_name',
      key: 'equipment_name',
    },
    {
      title: 'Provider',
      dataIndex: 'amcprovider_name',
      key: 'amcprovider_name',
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
    },
    {
      title: 'AMC Value',
      dataIndex: 'amc_value',
      key: 'amc_value',
      render: (value: number) => `₹${value.toLocaleString()}`,
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
      render: (record: AMCContract) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>Edit</a>
          <a onClick={() => {
            Modal.confirm({
              title: 'Are you sure you want to delete this contract?',
              onOk: () => handleDelete(record.amccontract_id),
              okText: 'Yes',
              cancelText: 'No',
            });
          }} style={{ color: '#ff4d4f' }}>Delete</a>
        </Space>
      ),
    },
  ];

  return (
    <Card title="AMC Contracts">
      <a 
        onClick={handleAdd}
        style={{ 
          display: 'inline-block', 
          marginBottom: 16,
          padding: '4px 15px',
          backgroundColor: '#1890ff',
          color: 'white',
          borderRadius: '2px'
        }}
      >
        Add Contract
      </a>

      <Table
        columns={columns}
        dataSource={contracts}
        rowKey="amccontract_id"
        scroll={{ x: true }}
      />

      <Modal
        title={editingContract ? 'Edit AMC Contract' : 'Add AMC Contract'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
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
              { type: 'number', min: 0, message: 'Value must be greater than 0' }
            ]}
          >
            <Input type="number" prefix="₹" />
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
                {editingContract ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AMCContracts; 