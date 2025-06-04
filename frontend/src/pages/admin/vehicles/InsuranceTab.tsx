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
import { vehicles } from '../../../utils/api';
import type { Vehicle, VehicleInsurance, VehicleInsuranceCreate } from '../../../types/vehicles';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const InsuranceTab: React.FC = () => {
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [insuranceList, setInsuranceList] = useState<VehicleInsurance[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<VehicleInsurance | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

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
    setIsModalVisible(true);
  };

  const handleEdit = (record: VehicleInsurance) => {
    setEditingRecord(record);
    form.setFieldsValue({
      insurance_provider: record.insurance_provider,
      policy_number: record.policy_number,
      insurance_period: [
        dayjs(record.insurance_start_date),
        dayjs(record.insurance_end_date)
      ]
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (record: VehicleInsurance) => {
    try {
      await vehicles.deleteInsurance(record.insurance_id);
      message.success('Insurance record deleted successfully');
      if (selectedVehicle) {
        fetchInsurance(selectedVehicle);
      }
    } catch (error) {
      console.error('Failed to delete insurance record:', error);
      message.error('Failed to delete insurance record');
    }
  };

  const handleSubmit = async (values: any) => {
    if (!selectedVehicle) {
      Modal.error({
        title: 'Error',
        content: 'Please select a vehicle first',
        width: 450,
        maskClosable: true,
        centered: true
      });
      return;
    }

    setLoading(true);
    try {
      const [insuranceStart, insuranceEnd] = values.insurance_period;
      const data: VehicleInsuranceCreate = {
        vehicle_id: selectedVehicle,
        insurance_provider: values.insurance_provider,
        policy_number: values.policy_number,
        insurance_start_date: insuranceStart.format('YYYY-MM-DD'),
        insurance_end_date: insuranceEnd.format('YYYY-MM-DD')
      };

      if (editingRecord) {
        await vehicles.updateInsurance(editingRecord.insurance_id, data);
        message.success('Insurance record updated successfully');
      } else {
        await vehicles.addInsurance(data);
        message.success('Insurance record added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchInsurance(selectedVehicle);
    } catch (error: any) {
      console.error('Failed to save insurance record:', error);
      
      let errorTitle = 'Error Saving Insurance Record';
      let errorMessage = 'Failed to save insurance record. Please try again.';
      
      if (error.response?.status === 400) {
        const responseData = error.response.data;
        
        if (error.response.data.code === '23505') {
          errorTitle = 'Duplicate Policy Number';
          errorMessage = 'This policy number already exists. Please enter a unique policy number.';
        } else if (responseData.detail === 'insurance_dates_check') {
          errorTitle = 'Invalid Date Range';
          errorMessage = 'Insurance end date must be after start date.';
        } else if (responseData.detail === 'no_insurance_overlap') {
          errorTitle = 'Date Overlap Detected';
          errorMessage = 'This vehicle already has insurance coverage for the specified time period. Please choose different dates.';
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      }
      
      Modal.error({
        title: errorTitle,
        content: (
          <div>
            <p>{errorMessage}</p>
            <p style={{ color: '#ff4d4f', marginTop: '10px' }}>
              Please review your input and try again.
            </p>
          </div>
        ),
        width: 450,
        maskClosable: true,
        centered: true,
        okText: 'Close'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<VehicleInsurance> = [
    {
      title: 'Insurance Provider',
      dataIndex: 'insurance_provider',
      key: 'insurance_provider',
      sorter: (a, b) => a.insurance_provider.localeCompare(b.insurance_provider),
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
      sorter: (a, b) => dayjs(a.insurance_start_date).unix() - dayjs(b.insurance_start_date).unix(),
    },
    {
      title: 'End Date',
      dataIndex: 'insurance_end_date',
      key: 'insurance_end_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.insurance_end_date).unix() - dayjs(b.insurance_end_date).unix(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const now = dayjs();
        const endDate = dayjs(record.insurance_end_date);
        const daysLeft = endDate.diff(now, 'day');
        
        if (daysLeft < 0) {
          return <span style={{ color: 'red' }}>Expired</span>;
        } else if (daysLeft <= 30) {
          return <span style={{ color: 'orange' }}>Expiring Soon ({daysLeft} days)</span>;
        }
        return <span style={{ color: 'green' }}>Active</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    }
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

      <Modal
        title={editingRecord ? 'Edit Insurance Record' : 'Add Insurance Record'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
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
                    if (value[0].isSame(value[1]) || value[0].isAfter(value[1])) {
                      throw new Error('End date must be after start date');
                    }
                  }
                }
              }
            ]}
            help="Select start and end dates for the insurance period. Dates must not overlap with existing insurance records."
          >
            <RangePicker 
              style={{ width: '100%' }}
              disabledDate={(current) => {
                const [start, end] = form.getFieldValue('insurance_period') || [];
                if (!start && !end) {
                  return false;
                }
                return (start && current && current.isBefore(start, 'day')) ||
                       (end && current && current.isAfter(end, 'day'));
              }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRecord ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                setEditingRecord(null);
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

export default InsuranceTab; 