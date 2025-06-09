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
  DatePicker,
  Popconfirm
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api, { amcContracts } from '../../../utils/api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import ActionButtons from '../../../components/common/ActionButtons';
import FormModal from '../../../components/common/FormModal';

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

interface AMCMappingProps {
  onMappingDeleted?: () => void;
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

const AMCMappingComponent: React.FC<AMCMappingProps> = ({ onMappingDeleted }) => {
  const [mappings, setMappings] = useState<AMCMapping[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMapping, setEditingMapping] = useState<AMCMapping | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isContractActive = (record: AMCMapping) => {
    const today = dayjs();
    const endDate = dayjs(record.end_date);
    return endDate.isAfter(today);
  };

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
    setError(null);
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
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
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/amc/contracts/${id}`);
      message.success('Contract deleted successfully');
      fetchData();
      onMappingDeleted?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete contract');
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
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <span style={{ 
          color: isContractActive(record) ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {isContractActive(record) ? 'Active' : 'Inactive'}
        </span>
      ),
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
      render: (_, record) => (
        <ActionButtons
          onEdit={() => {
            setEditingMapping(record);
            form.setFieldsValue({
              equipment_id: record.equipment_id,
              amcprovider_id: record.amcprovider_id,
              contract_period: [
                dayjs(record.start_date),
                dayjs(record.end_date)
              ],
              amc_value: record.amc_value,
              remarks: record.remarks
            });
            setError(null);
            setIsModalVisible(true);
          }}
          onDelete={() => handleDelete(record.amccontract_id)}
          deleteDisabled={!isContractActive(record)}
          deleteTooltip="Only active AMC contracts can be deleted"
          recordName={`${record.equipment_name} - ${record.amcprovider_name}`}
        />
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

      <FormModal
        title={editingMapping ? 'Edit Equipment Mapping' : 'Add Equipment Mapping'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setError(null);
          form.resetFields();
        }}
        form={form}
        onFinish={handleSubmit}
        loading={loading}
        error={error}
        width={600}
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
          rules={[
            { required: true, message: 'Please select contract period' },
            {
              validator: async (_, value) => {
                if (value && value[0] && value[1]) {
                  const start = dayjs(value[0]);
                  const end = dayjs(value[1]);
                  if (start.isSame(end) || start.isAfter(end)) {
                    throw new Error('End date must be after start date');
                  }
                }
              }
            }
          ]}
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
      </FormModal>
    </>
  );
};

export default AMCMappingComponent; 