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
  Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { vehicles } from '../../../utils/api';
import type { Vehicle, VehicleCreate } from '../../../types/vehicles';
import dayjs from 'dayjs';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { VEHICLE_COMPANIES } from '../../../constants/vehicles';

const VehiclesTab: React.FC = () => {
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [vehiclesWithRecords, setVehiclesWithRecords] = useState<Set<number>>(new Set());

  const checkVehicleRecords = async (vehicleId: number) => {
    try {
      const [insuranceRes, servicingRes] = await Promise.all([
        vehicles.getInsurance(vehicleId),
        vehicles.getServicing(vehicleId)
      ]);
      
      const hasRecords = (insuranceRes.data?.length || 0) > 0 || (servicingRes.data?.length || 0) > 0;
      
      // Update vehiclesWithRecords state
      setVehiclesWithRecords(prev => {
        const newSet = new Set(Array.from(prev));
        if (hasRecords) {
          newSet.add(vehicleId);
        } else {
          newSet.delete(vehicleId);
        }
        return newSet;
      });
      
      return hasRecords;
    } catch (error) {
      console.error('Error checking vehicle records:', error);
      return false;
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehicles.getAll();
      setVehiclesList(response.data);
      
      // Check records for each vehicle
      const newVehiclesWithRecords = new Set<number>();
      await Promise.all(response.data.map(async (vehicle) => {
        const hasRecords = await checkVehicleRecords(vehicle.vehicle_id);
        if (hasRecords) {
          newVehiclesWithRecords.add(vehicle.vehicle_id);
        }
      }));
      setVehiclesWithRecords(newVehiclesWithRecords);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      message.error('Failed to fetch vehicles');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAdd = () => {
    setEditingVehicle(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Vehicle) => {
    setEditingVehicle(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: VehicleCreate) => {
    setLoading(true);
    try {
      if (editingVehicle) {
        await vehicles.update(editingVehicle.vehicle_id, values);
        message.success('Vehicle updated successfully');
      } else {
        await vehicles.create(values);
        message.success('Vehicle added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchVehicles();
    } catch (error: any) {
      console.error('Failed to save vehicle:', error);
      message.error(error.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
    form.setFieldsValue({ model: undefined }); // Reset model when company changes
  };

  const handleDelete = async (record: Vehicle) => {
    Modal.confirm({
      title: 'Delete Vehicle',
      content: (
        <div>
          <p>Are you sure you want to delete {record.company_name} - {record.model}?</p>
        </div>
      ),
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      width: 450,
      onOk: async () => {
        try {
          // Double check for records
          const hasRecords = await checkVehicleRecords(record.vehicle_id);
          if (hasRecords) {
            Modal.error({
              title: 'Cannot Delete Vehicle',
              content: 'This vehicle has active insurance or servicing records. Please delete those records first.',
              width: 450,
              maskClosable: true,
              centered: true,
              okText: 'Close'
            });
            return Promise.reject();
          }

          await vehicles.delete(record.vehicle_id);
          message.success('Vehicle deleted successfully');
          await fetchVehicles(); // Refresh the list after deletion
        } catch (error: any) {
          console.error('Failed to delete vehicle:', error);
          Modal.error({
            title: 'Cannot Delete Vehicle',
            content: error.response?.data?.message || 'Failed to delete vehicle',
            width: 450,
            maskClosable: true,
            centered: true,
            okText: 'Close'
          });
          return Promise.reject();
        }
      }
    });
  };

  const columns: ColumnsType<Vehicle> = [
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      sorter: (a, b) => a.company_name.localeCompare(b.company_name),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      sorter: (a, b) => a.model.localeCompare(b.model),
    },
    {
      title: 'Registration No',
      dataIndex: 'registration_no',
      key: 'registration_no',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          {vehiclesWithRecords.has(record.vehicle_id) ? (
            <Tooltip title="Cannot delete vehicle with active insurance or servicing records">
              <Button type="link" danger disabled>
                Delete
              </Button>
            </Tooltip>
          ) : (
            <Button
              type="link"
              danger
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          )}
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
        Add Vehicle
      </Button>

      <Table
        columns={columns}
        dataSource={vehiclesList}
        rowKey="vehicle_id"
      />

      <Modal
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedCompany(null);
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
            name="company_name"
            label="Company Name"
            rules={[{ required: true, message: 'Please select company name' }]}
          >
            <Select
              placeholder="Select company"
              onChange={handleCompanyChange}
            >
              {VEHICLE_COMPANIES.map(company => (
                <Select.Option key={company.name} value={company.name}>
                  {company.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="model"
            label="Model"
            rules={[{ required: true, message: 'Please select model' }]}
          >
            <Select
              placeholder="Select model"
              disabled={!selectedCompany}
            >
              {selectedCompany && VEHICLE_COMPANIES.find(c => c.name === selectedCompany)?.models.map(model => (
                <Select.Option key={model} value={model}>
                  {model}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="registration_no"
            label="Registration No"
            rules={[{ required: true, message: 'Please enter registration number' }]}
          >
            <Input placeholder="Enter registration number" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingVehicle ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                setSelectedCompany(null);
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

export default VehiclesTab; 