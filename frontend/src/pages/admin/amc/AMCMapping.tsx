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
  Tag,
  InputNumber,
  Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import api, { amcContracts } from '../../../utils/api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface Equipment {
  equipment_id: number;
  equipment_name: string;
  has_active_mapping?: boolean;
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
  created_at: string;
  equipment_name: string;
  amcprovider_name: string;
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
      const token = localStorage.getItem('token');
      console.log('Authentication status:', {
        hasToken: !!token,
        tokenLength: token?.length
      });

      console.log('Fetching AMC data...');
      const [providersRes, contractsResponse, equipmentsRes] = await Promise.all([
        api.get('/amc/providers'),
        amcContracts.getAll(),
        api.get('/amc/equipments')
      ]);

      console.log('API Responses:', {
        providers: providersRes.data,
        contracts: contractsResponse.data,
        equipments: equipmentsRes.data
      });

      const providers = providersRes.data;
      const equipments = equipmentsRes.data;
      const mappings = Array.isArray(contractsResponse.data) ? contractsResponse.data : [];

      // Enrich mappings with equipment and provider names
      const enrichedMappings = mappings.map(mapping => {
        const equipment = equipments.find((e: any) => e.equipment_id === mapping.equipment_id);
        const provider = providers.find((p: any) => p.amcprovider_id === mapping.amcprovider_id);
        
        console.log('Mapping enrichment:', {
          mapping,
          foundEquipment: equipment,
          foundProvider: provider
        });

        return {
          ...mapping,
          equipment_name: equipment?.equipment_name || 'Unknown Equipment',
          amcprovider_name: provider?.amcprovider_name || 'Unknown Provider'
        };
      });

      console.log('Final enriched mappings:', enrichedMappings);

      setMappings(enrichedMappings);
      setProviders(providers);
      setEquipments(equipments);
    } catch (error: any) {
      console.error('Error fetching data:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error('Failed to fetch AMC mappings. Please try again later.');
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
      equipment_id: record.equipment_id,
      amcprovider_id: record.amcprovider_id,
      contract_period: [dayjs(record.start_date), dayjs(record.end_date)],
      amc_value: record.amc_value,
      remarks: record.remarks
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await amcContracts.delete(id);
      message.success('AMC mapping deleted successfully');
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting mapping:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete AMC mapping. Please try again later.';
      message.error(errorMessage);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Raw form values:', values);

      // Check if contract_period exists and has both dates
      if (!values.contract_period || !Array.isArray(values.contract_period) || values.contract_period.length !== 2) {
        message.error('Please select both start and end dates');
        return;
      }

      const [startDate, endDate] = values.contract_period;
      if (!startDate || !endDate) {
        message.error('Please select both start and end dates');
        return;
      }

      // Log the date objects
      console.log('Date objects:', {
        startDate: startDate?.toDate(),
        endDate: endDate?.toDate(),
        startDateType: typeof startDate,
        endDateType: typeof endDate
      });

      const data = {
        equipment_id: parseInt(values.equipment_id),
        amcprovider_id: parseInt(values.amcprovider_id),
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        amc_value: parseFloat(values.amc_value),
        remarks: values.remarks || ''
      };

      console.log('Submitting data to API:', data);

      if (editingMapping) {
        console.log('Updating existing mapping:', editingMapping.amccontract_id);
        const response = await amcContracts.update(editingMapping.amccontract_id, data);
        console.log('Update response:', response);
        message.success('AMC mapping updated successfully');
      } else {
        console.log('Creating new mapping');
        const response = await amcContracts.create(data);
        console.log('Create response:', response);
        message.success('AMC mapping added successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving mapping:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });

      // Extract error message from response
      let errorMessage = 'Failed to save AMC mapping. Please try again.';
      if (error.response?.data) {
        const { message: serverMessage, details } = error.response.data;
        errorMessage = serverMessage;
        if (details) {
          errorMessage += `: ${details}`;
        }
      }

      // Show error message in popup
      message.error({
        content: errorMessage,
        duration: 5, // Show for 5 seconds
        style: {
          marginTop: '20vh',
        },
      });
    }
  };

  const getStatus = (endDate: string): 'ACTIVE' | 'INACTIVE' => {
    return dayjs(endDate).isAfter(dayjs()) ? 'ACTIVE' : 'INACTIVE';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'INACTIVE':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<AMCMapping> = [
    {
      title: 'Equipment',
      dataIndex: 'equipment_name',
      key: 'equipment_name',
      sorter: (a, b) => (a.equipment_name || '').localeCompare(b.equipment_name || ''),
    },
    {
      title: 'Provider',
      dataIndex: 'amcprovider_name',
      key: 'amcprovider_name',
      sorter: (a, b) => (a.amcprovider_name || '').localeCompare(b.amcprovider_name || ''),
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
      render: (value: number, record: AMCMapping) => (
        <Tooltip 
          title={record.remarks ? `Remarks: ${record.remarks}` : 'No remarks'} 
          placement="top"
        >
          <span>₹ {value.toLocaleString('en-IN')}</span>
        </Tooltip>
      ),
      sorter: (a, b) => a.amc_value - b.amc_value
    },
    {
      title: 'Status',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (endDate: string) => {
        const status = getStatus(endDate);
        return (
          <Tag color={getStatusColor(status)}>
            {status}
          </Tag>
        );
      },
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' }
      ],
      onFilter: (value: Key | boolean, record: AMCMapping) => {
        const status = getStatus(record.end_date);
        return status === value.toString();
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              Modal.confirm({
                title: 'Delete AMC Mapping',
                content: 'Are you sure you want to delete this AMC mapping?',
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk: () => handleDelete(record.amccontract_id)
              });
            }}
          >
            Delete
          </Button>
        </Space>
      )
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
            <Select 
              placeholder="Select equipment"
              disabled={editingMapping !== null}
            >
              {equipments.map(equipment => (
                <Select.Option 
                  key={equipment.equipment_id} 
                  value={equipment.equipment_id}
                  disabled={!editingMapping && equipment.has_active_mapping}
                >
                  {equipment.equipment_name}
                  {equipment.has_active_mapping && !editingMapping && ' (Has Active Mapping)'}
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
            <RangePicker 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="amc_value"
            label="AMC Value"
            rules={[
              { required: true, message: 'Please enter AMC value' },
              { type: 'number', min: 0, message: 'AMC value must be positive' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea 
              rows={4}
              placeholder="Enter any additional remarks or notes"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingMapping ? 'Update' : 'Add'} Mapping
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