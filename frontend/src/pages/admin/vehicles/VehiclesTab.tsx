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
  Tooltip,
  Popconfirm
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { vehicles } from '../../../utils/api';
import type { Vehicle, VehicleCreate } from '../../../types/vehicles';
import dayjs from 'dayjs';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { VEHICLE_COMPANIES } from '../../../constants/vehicles';
import ActionButtons from '../../../components/common/ActionButtons';
import FormModal from '../../../components/common/FormModal';

const VehiclesTab: React.FC = () => {
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setSelectedCompany(null);
    form.resetFields();
    setError(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: Vehicle) => {
    setEditingVehicle(record);
    setSelectedCompany(record.company_name);
    form.setFieldsValue(record);
    setError(null);
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: VehicleCreate) => {
    setLoading(true);
    setError(null);
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
      setError(error.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
    form.setFieldsValue({ model: undefined }); // Reset model when company changes
  };

  const handleDelete = async (vehicleId: number) => {
    try {
      const hasRecords = await checkVehicleRecords(vehicleId);
      if (hasRecords) {
        message.error('Cannot delete vehicle with active insurance or servicing records');
        return;
      }

      await vehicles.delete(vehicleId);
      message.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete vehicle');
    }
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
        <ActionButtons
          onEdit={() => handleEdit(record)}
          onDelete={() => handleDelete(record.vehicle_id)}
          deleteDisabled={vehiclesWithRecords.has(record.vehicle_id)}
          deleteTooltip="Cannot delete vehicle that has insurance or servicing history. This preserves the record history."
          recordName={`${record.company_name} - ${record.model}`}
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
        Add Vehicle
      </Button>

      <Table
        columns={columns}
        dataSource={vehiclesList}
        rowKey="vehicle_id"
      />

      <FormModal
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedCompany(null);
          setError(null);
          form.resetFields();
        }}
        form={form}
        onFinish={handleSubmit}
        loading={loading}
        error={error}
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
      </FormModal>
    </>
  );
};

export default VehiclesTab; 