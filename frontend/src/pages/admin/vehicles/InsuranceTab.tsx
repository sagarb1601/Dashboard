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
  Tooltip,
  Switch,
  Alert
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { vehicles } from '../../../utils/api';
import type { Vehicle, VehicleInsurance, VehicleInsuranceCreate } from '../../../types/vehicles';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import moment from 'moment';
import ActionButtons from '../../../components/common/ActionButtons';
import FormModal from '../../../components/common/FormModal';

// Configure dayjs plugins
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const InsuranceTab: React.FC = () => {
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [insuranceList, setInsuranceList] = useState<VehicleInsurance[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<VehicleInsurance | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      const response = await vehicles.getAll();
      setVehiclesList(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      message.error('Failed to fetch vehicles');
    }
  };

  const fetchInsurance = async (vehicleId: number) => {
    console.log('Fetching insurance records for vehicle ID:', vehicleId);
    try {
      const response = await vehicles.getInsurance(vehicleId);
      console.log('Insurance records response:', response);
      setInsuranceList(response.data);
    } catch (error) {
      console.error('Failed to fetch insurance records:', error);
      message.error('Failed to fetch insurance records');
    }
  };

  useEffect(() => {
    console.log('InsuranceTab mounted');
    fetchVehicles();
  }, []);

  const handleVehicleSelect = (value: number) => {
    console.log('Vehicle selected:', value);
    setSelectedVehicle(value);
    fetchInsurance(value);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setError(null);
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = values.insurance_period[0].format('YYYY-MM-DD');
      const endDate = values.insurance_period[1].format('YYYY-MM-DD');
      
      const insuranceData: VehicleInsuranceCreate = {
        vehicle_id: selectedVehicle!,
        insurance_provider: values.insurance_provider,
        policy_number: values.policy_number,
        insurance_start_date: startDate,
        insurance_end_date: endDate
      };

      if (editingRecord) {
        await vehicles.updateInsurance(editingRecord.insurance_id, insuranceData);
        message.success('Insurance record updated successfully');
      } else {
        await vehicles.addInsurance(insuranceData);
        message.success('Insurance record added successfully');
      }

      if (selectedVehicle) {
        fetchInsurance(selectedVehicle);
      }
      
      setIsModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save insurance record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: VehicleInsurance) => {
    try {
      await vehicles.deleteInsurance(record.insurance_id);
      message.success('Insurance record deleted successfully');
      if (selectedVehicle) {
        fetchInsurance(selectedVehicle);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete insurance record');
    }
  };

  const isInsuranceActive = (record: VehicleInsurance) => {
    const today = dayjs();
    const endDate = dayjs(record.insurance_end_date);
    return endDate.isAfter(today);
  };

  const columns: ColumnsType<VehicleInsurance> = [
    {
      title: 'Insurance Provider',
      dataIndex: 'insurance_provider',
      key: 'insurance_provider',
    },
    {
      title: 'Policy Number',
      dataIndex: 'policy_number',
      key: 'policy_number',
    },
    {
      title: 'Start Date',
      dataIndex: 'insurance_start_date',
      key: 'insurance_start_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'insurance_end_date',
      key: 'insurance_end_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <span style={{ 
          color: isInsuranceActive(record) ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {isInsuranceActive(record) ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <ActionButtons
          onEdit={() => {
            setEditingRecord(record);
            form.setFieldsValue({
              insurance_provider: record.insurance_provider,
              policy_number: record.policy_number,
              insurance_period: [
                dayjs(record.insurance_start_date),
                dayjs(record.insurance_end_date),
              ],
            });
            setError(null);
            setIsModalVisible(true);
          }}
          onDelete={() => handleDelete(record)}
          deleteDisabled={!isInsuranceActive(record)}
          deleteTooltip="Only active insurance records can be deleted"
          recordName="Insurance Record"
        />
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} size="middle">
        <Select
          style={{ width: 300 }}
          placeholder="Select Vehicle"
          onChange={handleVehicleSelect}
          value={selectedVehicle}
        >
          {vehiclesList.map(vehicle => (
            <Select.Option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
              {vehicle.company_name} - {vehicle.model} ({vehicle.registration_no})
            </Select.Option>
          ))}
        </Select>

        <Button
          type="primary"
          onClick={handleAdd}
          disabled={!selectedVehicle}
        >
          Add Insurance Record
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={insuranceList}
        rowKey="insurance_id"
      />

      <FormModal
        title={editingRecord ? 'Edit Insurance Record' : 'Add Insurance Record'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
          setError(null);
          form.resetFields();
        }}
        form={form}
        onFinish={handleSubmit}
        loading={loading}
        error={error}
      >
        <Form.Item
          name="insurance_provider"
          label="Insurance Provider"
          rules={[
            { required: true, message: 'Please enter insurance provider name' },
            { min: 2, message: 'Provider name must be at least 2 characters' },
            { max: 100, message: 'Provider name cannot exceed 100 characters' }
          ]}
          help="Enter the name of the insurance provider"
        >
          <Input placeholder="Enter insurance provider name" />
        </Form.Item>

        <Form.Item
          name="policy_number"
          label="Policy Number"
          rules={[
            { required: true, message: 'Please enter policy number' },
            { min: 3, message: 'Policy number must be at least 3 characters' },
            { max: 50, message: 'Policy number cannot exceed 50 characters' }
          ]}
          help="Enter a unique policy number. Duplicate policy numbers are not allowed."
        >
          <Input placeholder="Enter policy number" />
        </Form.Item>

        <Form.Item
          name="insurance_period"
          label="Insurance Period"
          rules={[
            { required: true, message: 'Please select insurance period' },
            {
              validator: async (_, value) => {
                if (value && value[0] && value[1]) {
                  const start = moment(value[0].format('YYYY-MM-DD'));
                  const end = moment(value[1].format('YYYY-MM-DD'));
                  if (start.isSame(end) || start.isAfter(end)) {
                    throw new Error('End date must be after start date');
                  }
                }
              }
            }
          ]}
          help="Select start and end dates for the insurance period"
        >
          <RangePicker 
            style={{ width: '100%' }}
          />
        </Form.Item>
      </FormModal>
    </>
  );
};

export default InsuranceTab; 