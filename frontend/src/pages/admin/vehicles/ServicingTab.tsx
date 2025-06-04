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
  InputNumber
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { vehicles } from '../../../utils/api';
import type { Vehicle, VehicleServicing, VehicleServicingCreate } from '../../../types/vehicles';
import dayjs from 'dayjs';

const ServicingTab: React.FC = () => {
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [servicingList, setServicingList] = useState<VehicleServicing[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<VehicleServicing | null>(null);
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

  const fetchServicing = async (vehicleId: number) => {
    try {
      const response = await vehicles.getServicing(vehicleId);
      setServicingList(response.data);
    } catch (error) {
      console.error('Failed to fetch servicing records:', error);
      message.error('Failed to fetch servicing records');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleVehicleSelect = (value: number) => {
    setSelectedVehicle(value);
    fetchServicing(value);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: VehicleServicing) => {
    setEditingRecord(record);
    form.setFieldsValue({
      service_date: dayjs(record.service_date),
      next_service_date: dayjs(record.next_service_date),
      service_description: record.service_description,
      servicing_amount: record.servicing_amount
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (record: VehicleServicing) => {
    try {
      await vehicles.deleteServicing(record.service_id);
      message.success('Servicing record deleted successfully');
      if (selectedVehicle) {
        fetchServicing(selectedVehicle);
      }
    } catch (error) {
      console.error('Failed to delete servicing record:', error);
      message.error('Failed to delete servicing record');
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
      const data: VehicleServicingCreate = {
        vehicle_id: selectedVehicle,
        service_date: values.service_date.format('YYYY-MM-DD'),
        next_service_date: values.next_service_date.format('YYYY-MM-DD'),
        service_description: values.service_description,
        servicing_amount: values.servicing_amount
      };

      if (editingRecord) {
        await vehicles.updateServicing(editingRecord.service_id, data);
        message.success('Servicing record updated successfully');
      } else {
        await vehicles.addServicing(data);
        message.success('Servicing record added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchServicing(selectedVehicle);
    } catch (error: any) {
      console.error('Failed to save servicing record:', error);
      
      let errorMessage = 'Failed to save servicing record. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        switch (error.response.data.detail) {
          case 'service_dates_check':
            errorMessage = 'Next service date must be after service date.';
            break;
          case 'no_service_overlap':
            errorMessage = 'This vehicle already has a servicing record for the specified time period. Please choose different dates.';
            break;
          default:
            errorMessage = error.response.data.detail;
        }
      }
      
      Modal.error({
        title: 'Error Saving Servicing Record',
        content: errorMessage,
        width: 450,
        maskClosable: true,
        centered: true,
        okText: 'Close'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<VehicleServicing> = [
    {
      title: 'Service Date',
      dataIndex: 'service_date',
      key: 'service_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.service_date).unix() - dayjs(b.service_date).unix(),
    },
    {
      title: 'Next Service Date',
      dataIndex: 'next_service_date',
      key: 'next_service_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.next_service_date).unix() - dayjs(b.next_service_date).unix(),
    },
    {
      title: 'Description',
      dataIndex: 'service_description',
      key: 'service_description',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'servicing_amount',
      key: 'servicing_amount',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
      sorter: (a, b) => a.servicing_amount - b.servicing_amount,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const now = dayjs();
        const nextDate = dayjs(record.next_service_date);
        const daysLeft = nextDate.diff(now, 'day');
        
        if (daysLeft < 0) {
          return <span style={{ color: 'red' }}>Service Overdue</span>;
        } else if (daysLeft <= 7) {
          return <span style={{ color: 'orange' }}>Due Soon ({daysLeft} days)</span>;
        }
        return <span style={{ color: 'green' }}>On Schedule</span>;
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
          Add Servicing Record
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={servicingList}
        rowKey="service_id"
      />

      <Modal
        title={editingRecord ? 'Edit Servicing Record' : 'Add Servicing Record'}
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
            name="service_date"
            label="Service Date"
            rules={[
              { required: true, message: 'Please select service date' },
              {
                validator: async (_, value) => {
                  const nextDate = form.getFieldValue('next_service_date');
                  if (value && nextDate) {
                    if (value.isSame(nextDate) || value.isAfter(nextDate)) {
                      throw new Error('Service date must be before next service date');
                    }
                  }
                }
              }
            ]}
            help="Select the date when service was performed. Dates must not overlap with existing service records."
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Select service date"
            />
          </Form.Item>

          <Form.Item
            name="next_service_date"
            label="Next Service Date"
            rules={[
              { required: true, message: 'Please select next service date' },
              {
                validator: async (_, value) => {
                  const serviceDate = form.getFieldValue('service_date');
                  if (value && serviceDate) {
                    if (value.isSame(serviceDate) || value.isBefore(serviceDate)) {
                      throw new Error('Next service date must be after service date');
                    }
                  }
                }
              }
            ]}
            help="Select the recommended date for next service. Dates must not overlap with existing service records."
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="Select next service date"
              disabledDate={(current) => {
                const serviceDate = form.getFieldValue('service_date');
                return serviceDate && current && (current.isSame(serviceDate) || current.isBefore(serviceDate));
              }}
            />
          </Form.Item>

          <Form.Item
            name="service_description"
            label="Service Description"
            rules={[
              { required: true, message: 'Please enter service description' },
              { min: 10, message: 'Description must be at least 10 characters' },
              { max: 500, message: 'Description cannot exceed 500 characters' }
            ]}
            help="Enter detailed description of services performed"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter detailed service description"
            />
          </Form.Item>

          <Form.Item
            name="servicing_amount"
            label="Servicing Amount"
            rules={[
              { required: true, message: 'Please enter servicing amount' },
              { type: 'number', min: 0, message: 'Amount must be greater than 0' }
            ]}
            help="Enter the total cost of servicing"
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="₹"
              step={0.01}
              precision={2}
              placeholder="Enter amount"
              min={0}
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

export default ServicingTab; 