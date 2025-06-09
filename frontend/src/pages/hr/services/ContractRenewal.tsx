import React, { useState, useEffect } from 'react';
import { Form, Button, Select, DatePicker, Input, InputNumber, Table, Space, Modal, message } from 'antd';
import api from '../../../utils/api';
import dayjs from 'dayjs';
import type { SelectProps } from 'antd/es/select';

interface Employee {
  employee_id: number;
  employee_name: string;
}

interface ContractRenewal {
  id: number;
  employee_id: number;
  employee_name: string;
  contract_type: 'INITIAL' | 'RENEWAL';
  start_date: string;
  end_date: string;
  duration_months: number;
  remarks?: string;
  created_at: string;
}

const ContractRenewal: React.FC = () => {
  const [form] = Form.useForm();
  const [contracts, setContracts] = useState<ContractRenewal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRenewal | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/services/contracts');
      setContracts(response.data);
    } catch (error) {
      message.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/hr/employees');
      setEmployees(response.data);
    } catch (error) {
      message.error('Failed to fetch employees');
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchEmployees();
  }, []);

  // Add function to check for overlapping dates
  const checkForOverlappingDates = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, employeeId: number, currentContractId?: number) => {
    const existingContracts = contracts.filter(c => 
      c.employee_id === employeeId && 
      (!currentContractId || c.id !== currentContractId)
    );

    return existingContracts.some(contract => {
      const contractStart = dayjs(contract.start_date);
      const contractEnd = dayjs(contract.end_date);
      
      return (
        (startDate <= contractEnd && endDate >= contractStart) ||
        (contractStart <= endDate && contractEnd >= startDate)
      );
    });
  };

  // Update form validation
  const validateDates = {
    validator: async (_: any, value: any) => {
      const startDate = form.getFieldValue('start_date');
      const endDate = form.getFieldValue('end_date');
      const employeeId = form.getFieldValue('employee_id');
      
      if (startDate && endDate) {
        // Check if end date is before start date
        if (endDate.isBefore(startDate)) {
          throw new Error('End date cannot be before start date');
        }

        // Check for overlapping dates
        if (employeeId && checkForOverlappingDates(startDate, endDate, employeeId, editingContract?.id)) {
          throw new Error('Contract dates overlap with an existing contract for this employee');
        }
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Additional validation before submission
      const startDate = values.start_date;
      const endDate = values.end_date;
      const employeeId = values.employee_id;

      // Check for overlapping dates
      if (checkForOverlappingDates(startDate, endDate, employeeId, editingContract?.id)) {
        message.error('Contract dates overlap with an existing contract for this employee');
        return;
      }

      const data = {
        ...values,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
      };

      if (editingContract) {
        try {
          await api.put(`/hr/services/contracts/${editingContract.id}`, data);
          message.success('Contract updated successfully');
          setOpen(false);
          form.resetFields();
          setEditingContract(null);
          fetchContracts();
        } catch (error: any) {
          if (error.response?.status === 409) {
            Modal.error({
              title: 'Contract Overlap Error',
              content: 'Contract dates overlap with an existing contract for this employee. Please choose different dates.',
            });
          } else {
            throw error;
          }
        }
      } else {
        try {
          await api.post('/hr/services/contracts', data);
          message.success('Contract added successfully');
          setOpen(false);
          form.resetFields();
          setEditingContract(null);
          fetchContracts();
        } catch (error: any) {
          if (error.response?.status === 409) {
            Modal.error({
              title: 'Contract Overlap Error',
              content: 'Contract dates overlap with an existing contract for this employee. Please choose different dates.',
            });
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Failed to save contract:', error);
      message.error('Failed to save contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hr/services/contracts/${id}`);
      message.success('Contract deleted successfully');
      fetchContracts();
    } catch (error) {
      message.error('Failed to delete contract');
    }
  };

  const handleEmployeeChange = (employeeId: number) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    setSelectedEmployee(employee || null);
  };

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      sorter: (a: ContractRenewal, b: ContractRenewal) => a.employee_id - b.employee_id,
    },
    {
      title: 'Employee Name',
      dataIndex: 'employee_name',
      key: 'employee_name',
      sorter: (a: ContractRenewal, b: ContractRenewal) => a.employee_name.localeCompare(b.employee_name),
    },
    {
      title: 'Contract Type',
      dataIndex: 'contract_type',
      key: 'contract_type',
      render: (type: string) => type === 'INITIAL' ? 'Initial Contract' : 'Renewal',
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
      title: 'Duration (Months)',
      dataIndex: 'duration_months',
      key: 'duration_months',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ContractRenewal) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingContract(record);
              form.setFieldsValue({
                ...record,
                start_date: dayjs(record.start_date),
                end_date: dayjs(record.end_date),
              });
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const validateDuration = (_: any, value: number) => {
    const contractType = form.getFieldValue('contract_type');
    if (contractType === 'INITIAL') {
      if (value < 12 || value > 36) {
        return Promise.reject('Initial contract duration must be between 12 and 36 months');
      }
    } else {
      if (value < 6 || value > 24) {
        return Promise.reject('Renewal duration must be between 6 and 24 months');
      }
    }
    return Promise.resolve();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>Contract Renewals</h2>
        
        {/* Employee Search/Select Box */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', maxWidth: '600px' }}>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Search employee by ID or name"
            optionFilterProp="children"
            value={selectedEmployee?.employee_id}
            onChange={handleEmployeeChange}
            filterOption={(input, option) =>
              option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
            options={employees.map(emp => ({
              value: emp.employee_id,
              label: `${emp.employee_id} - ${emp.employee_name}`
            }))}
            allowClear
            onClear={() => setSelectedEmployee(null)}
          />
          <Button 
            type="primary"
            onClick={() => {
              setEditingContract(null);
              form.resetFields();
              if (selectedEmployee) {
                form.setFieldsValue({ employee_id: selectedEmployee.employee_id });
              }
              setOpen(true);
            }}
            disabled={!selectedEmployee}
          >
            Record Contract
          </Button>
        </div>
      </div>

      {/* Show table only when an employee is selected */}
      {selectedEmployee && (
        <Table
          columns={columns}
          dataSource={contracts.filter(c => c.employee_id === selectedEmployee.employee_id)}
          rowKey="id"
          loading={loading}
        />
      )}

      {/* Show message when no employee is selected */}
      {!selectedEmployee && (
        <div style={{ textAlign: 'center', padding: '32px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Please select an employee to view their contract history</p>
        </div>
      )}

      <Modal
        title={editingContract ? 'Edit Contract' : 'New Contract'}
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setEditingContract(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="employee_id"
            label="Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select
              showSearch
              placeholder="Select employee"
              optionFilterProp="children"
              disabled={!!selectedEmployee}
              options={employees.map(emp => ({
                value: emp.employee_id,
                label: `${emp.employee_id} - ${emp.employee_name}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="contract_type"
            label="Contract Type"
            rules={[{ required: true, message: 'Please select contract type' }]}
          >
            <Select>
              <Select.Option value="INITIAL">Initial Contract</Select.Option>
              <Select.Option value="RENEWAL">Renewal</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="start_date"
            label="Start Date"
            rules={[
              { required: true, message: 'Please select start date' },
              validateDates
            ]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="end_date"
            label="End Date"
            rules={[
              { required: true, message: 'Please select end date' },
              validateDates
            ]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="duration_months"
            label="Duration (Months)"
            rules={[
              { required: true, message: 'Please enter duration' },
              { validator: validateDuration }
            ]}
          >
            <InputNumber min={1} max={36} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingContract ? 'Update' : 'Record'} Contract
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractRenewal; 