import React, { useState, useEffect } from 'react';
import { Form, Button, Select, DatePicker, Input, InputNumber, Table, Space, Modal, message } from 'antd';
import api from '../../../utils/api';
import dayjs from '../../../utils/dayjs-setup';
import type { Dayjs } from 'dayjs';

interface Employee {
  employee_id: number;
  employee_name: string;
  status: 'ACTIVE' | 'INACTIVE';
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

interface ContractFormValues {
  employee_id: number;
  contract_type: ContractRenewal['contract_type'];
  start_date: Dayjs;
  end_date: Dayjs;
  duration_months: number;
  remarks?: string;
}

interface DateConstraints {
  minDate?: Dayjs;
  maxDate?: Dayjs;
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
      const response = await api.get('/contracts');
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

  const handleSubmit = async (values: ContractFormValues) => {
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
    } catch (error: any) {
      console.error('Failed to save contract:', error);
      let errorMessage = 'Failed to save contract';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Modal.error({
        title: 'Error',
        content: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/contracts/${id}`);
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

  // Add function to check for overlapping dates
  const checkForOverlappingDates = (startDate: Dayjs, endDate: Dayjs, employeeId: number, currentContractId?: number) => {
    const existingContracts = contracts.filter(c => 
      c.employee_id === employeeId && 
      (!currentContractId || c.id !== currentContractId)
    );

    return existingContracts.some(contract => {
      const contractStart = dayjs(contract.start_date);
      const contractEnd = dayjs(contract.end_date);
      
      return (
        (startDate.isSameOrBefore(contractEnd) && endDate.isSameOrAfter(contractStart)) ||
        (contractStart.isSameOrBefore(endDate) && contractEnd.isSameOrAfter(startDate))
      );
    });
  };

  // Calculate duration in months between two dates
  const calculateDuration = (startDate: Dayjs, endDate: Dayjs) => {
    return endDate.diff(startDate, 'month');
  };

  // Update duration when dates change
  const updateDuration = () => {
    const startDate = form.getFieldValue('start_date');
    const endDate = form.getFieldValue('end_date');
    if (startDate && endDate) {
      const duration = calculateDuration(startDate, endDate);
      form.setFieldValue('duration_months', duration);
    }
  };

  // Validate dates and duration based on contract type
  const validateDates = {
    validator: async (_: any, value: Dayjs) => {
      const startDate = form.getFieldValue('start_date');
      const endDate = form.getFieldValue('end_date');
      const contractType = form.getFieldValue('contract_type');
      
      if (startDate && endDate) {
        // Check if end date is before start date
        if (endDate.isBefore(startDate)) {
          throw new Error('End date cannot be before start date');
        }

        // Calculate duration
        const duration = calculateDuration(startDate, endDate);

        // Validate duration based on contract type
        if (contractType === 'INITIAL') {
          if (duration < 12 || duration > 36) {
            throw new Error('Initial contract duration must be between 12 and 36 months');
          }
        } else if (contractType === 'RENEWAL') {
          if (duration < 6 || duration > 24) {
            throw new Error('Renewal duration must be between 6 and 24 months');
          }
        }

        // Check for overlapping dates
        if (form.getFieldValue('employee_id') && 
            checkForOverlappingDates(startDate, endDate, form.getFieldValue('employee_id'), editingContract?.id)) {
          throw new Error('Contract dates overlap with an existing contract for this employee');
        }
      }
    }
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
        maskClosable={false}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          onValuesChange={(changedValues) => {
            if ('start_date' in changedValues || 'end_date' in changedValues) {
              updateDuration();
            }
          }}
        >
          <Form.Item
            name="employee_id"
            label="Employee"
            rules={[
              { required: true, message: 'Please select an employee' },
              {
                validator: async (_, value) => {
                  if (value) {
                    const employee = employees.find(e => e.employee_id === value);
                    if (employee?.status !== 'ACTIVE') {
                      throw new Error('Selected employee is not active');
                    }
                  }
                }
              }
            ]}
          >
            <Select
              showSearch
              placeholder="Select employee"
              optionFilterProp="children"
              disabled={!!editingContract || !!selectedEmployee}
              filterOption={(input, option) =>
                option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
              options={employees.map(emp => ({
                value: emp.employee_id,
                label: `${emp.employee_id} - ${emp.employee_name}`,
                disabled: emp.status !== 'ACTIVE'
              }))}
            />
          </Form.Item>

          <Form.Item
            name="contract_type"
            label="Contract Type"
            rules={[
              { required: true, message: 'Please select contract type' },
              {
                validator: async (_, value) => {
                  if (value === 'INITIAL') {
                    // Check if employee already has an initial contract
                    const employeeId = form.getFieldValue('employee_id');
                    if (employeeId) {
                      const hasInitialContract = contracts.some(
                        c => c.employee_id === employeeId && c.contract_type === 'INITIAL'
                      );
                      if (hasInitialContract) {
                        throw new Error('Employee already has an initial contract');
                      }
                    }
                  }
                }
              }
            ]}
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
            <DatePicker 
              style={{ width: '100%' }}
              onChange={updateDuration}
              disabledDate={(current) => {
                // Disable dates before today for new contracts
                if (!editingContract && current && current < dayjs().startOf('day')) {
                  return true;
                }
                return false;
              }}
            />
          </Form.Item>

          <Form.Item
            name="end_date"
            label="End Date"
            rules={[
              { required: true, message: 'Please select end date' },
              validateDates
            ]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              onChange={updateDuration}
              disabledDate={(current) => {
                const startDate = form.getFieldValue('start_date');
                if (!current) return false;
                // Disable dates before start date
                return startDate && current < startDate;
              }}
            />
          </Form.Item>

          <Form.Item
            name="duration_months"
            label="Duration (Months)"
            rules={[
              { required: true, message: 'Please enter duration' },
              {
                validator: async (_, value) => {
                  const contractType = form.getFieldValue('contract_type');
                  if (contractType === 'INITIAL') {
                    if (value < 12 || value > 36) {
                      throw new Error('Initial contract duration must be between 12 and 36 months');
                    }
                  } else if (contractType === 'RENEWAL') {
                    if (value < 6 || value > 24) {
                      throw new Error('Renewal duration must be between 6 and 24 months');
                    }
                  }
                }
              }
            ]}
          >
            <InputNumber 
              min={1} 
              max={36} 
              style={{ width: '100%' }} 
              disabled 
              readOnly
            />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
            rules={[
              { max: 500, message: 'Remarks cannot exceed 500 characters' }
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingContract ? 'Update' : 'Record'} Contract
              </Button>
              <Button onClick={() => {
                setOpen(false);
                form.resetFields();
                setEditingContract(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractRenewal; 