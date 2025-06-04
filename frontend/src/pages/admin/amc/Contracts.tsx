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
import axios from 'axios';
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

interface Contract {
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

const ContractsComponent: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [equipmentsRes, providersRes, contractsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/amc/equipments'),
        axios.get('http://localhost:5000/api/amc/providers'),
        axios.get('http://localhost:5000/api/amc/contracts')
      ]);

      if (Array.isArray(equipmentsRes.data)) setEquipments(equipmentsRes.data);
      if (Array.isArray(providersRes.data)) setProviders(providersRes.data);
      if (Array.isArray(contractsRes.data)) setContracts(contractsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingContract(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Contract) => {
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
      message.success('Contract deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete contract:', error);
      message.error('Failed to delete contract');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const [start_date, end_date] = values.contract_period.map((date: Dayjs) => 
        date.format('YYYY-MM-DD')
      );

      const submitData = {
        ...values,
        start_date,
        end_date
      };
      delete submitData.contract_period;

      if (editingContract) {
        await axios.put(
          `http://localhost:5000/api/amc/contracts/${editingContract.amccontract_id}`,
          submitData
        );
        message.success('Contract updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/amc/contracts', submitData);
        message.success('Contract added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Failed to save contract:', error);
      message.error('Failed to save contract');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Contract> = [
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
      render: (record: Contract) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure you want to delete this contract?',
                content: 'This action cannot be undone.',
                onOk: () => handleDelete(record.amccontract_id),
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
        Add Contract
      </Button>

      <Table
        columns={columns}
        dataSource={contracts}
        rowKey="amccontract_id"
      />

      <Modal
        title={editingContract ? 'Edit Contract' : 'Add Contract'}
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

export default ContractsComponent; 