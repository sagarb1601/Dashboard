import React, { useState, useEffect } from 'react';
import { Form, message, Input, Button, Select, DatePicker, Modal, Table, Space } from 'antd';
import type { SelectProps } from 'antd/es/select';
import type { DatePickerProps } from 'antd/es/date-picker';
import type { ButtonProps } from 'antd/es/button';
import api from '../../../utils/api';
import dayjs from 'dayjs';

interface Employee {
  employee_id: number;
  employee_name: string;
}

interface AttritionRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  reason_for_leaving: string;
  last_date: string;
  remarks: string;
}

const ATTRITION_REASONS = [
  'SUPERANNUATION',
  'BETTER_OPPORTUNITY',
  'HIGHER_EDUCATION',
  'HEALTH_REASONS',
  'PERSONAL_REASONS',
  'RELOCATION',
  'PERFORMANCE_ISSUES',
  'CONTRACT_COMPLETION',
  'RETIREMENT',
  'OTHER'
] as const;

type AttritionReason = typeof ATTRITION_REASONS[number];

const Attrition: React.FC = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attritionRecords, setAttritionRecords] = useState<AttritionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttritionRecord | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/hr/employees');
      console.log('Employees data:', response.data);
      if (!response.data || response.data.length === 0) {
        message.warning('No employees found');
      }
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to fetch employees');
    }
  };

  const fetchAttritionRecords = async () => {
    try {
      console.log('Fetching attrition records...');
      const response = await api.get('/hr/services/attrition').catch(error => {
        console.error('Axios error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw error;
      });
      console.log('Attrition API response:', response);
      if (!response.data || response.data.length === 0) {
        console.log('No attrition records found');
      }
      setAttritionRecords(response.data);
    } catch (error) {
      console.error('Error fetching attrition records:', error);
      message.error('Failed to fetch attrition records');
    }
  };

  useEffect(() => {
    console.log('Attrition component mounted');
    fetchEmployees();
    fetchAttritionRecords();
  }, []);

  const handleEdit = (record: AttritionRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      employee_id: record.employee_id,
      reason: record.reason_for_leaving,
      last_working_date: dayjs(record.last_date),
      remarks: record.remarks
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hr/services/attrition/${id}`);
      message.success('Attrition record deleted successfully');
      fetchAttritionRecords();
    } catch (error: any) {
      console.error('Error deleting attrition record:', error);
      message.error(error.response?.data?.message || 'Failed to delete attrition record');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const postData = {
        ...values,
        last_date: values.last_working_date.format('YYYY-MM-DD'),
        reason_for_leaving: values.reason,
        year: values.last_working_date.year(),
        month: values.last_working_date.month() + 1
      };
      
      if (editingRecord) {
        const response = await api.put(`/hr/services/attrition/${editingRecord.id}`, postData);
        if (response.data) {
          message.success('Attrition record updated successfully');
          form.resetFields();
          setOpen(false);
          setEditingRecord(null);
          fetchAttritionRecords();
        }
      } else {
        const response = await api.post('/hr/services/attrition', postData);
        if (response.data) {
          message.success('Attrition record added successfully');
          form.resetFields();
          setOpen(false);
          setEditingRecord(null);
          fetchAttritionRecords();
        }
      }
    } catch (error: any) {
      console.error('Error saving attrition record:', error);
      message.error(error.response?.data?.message || `Failed to ${editingRecord ? 'update' : 'add'} attrition record`);
    } finally {
      setLoading(false);
    }
  };

  const formatReason = (reason: string | null | undefined): string => {
    if (!reason) return '';
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const columns = [
    { title: 'Employee ID', dataIndex: 'employee_id', key: 'employee_id' },
    { title: 'Employee Name', dataIndex: 'employee_name', key: 'employee_name' },
    { 
      title: 'Reason', 
      dataIndex: 'reason_for_leaving',
      key: 'reason',
      render: (reason: string | null | undefined) => formatReason(reason)
    },
    { 
      title: 'Last Working Date', 
      dataIndex: 'last_date',
      key: 'last_working_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AttritionRecord) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              Modal.confirm({
                title: 'Delete Attrition Record',
                content: 'Are you sure you want to delete this attrition record? This action cannot be undone.',
                okText: 'Yes, Delete',
                okType: 'danger',
                cancelText: 'No, Cancel',
                onOk: () => handleDelete(record.id),
                maskClosable: true
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    }
  ];

  const handleEmployeeChange = (employeeId: number) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    setSelectedEmployee(employee || null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>Employee Attrition</h2>
        
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
              setEditingRecord(null);
              form.resetFields();
              if (selectedEmployee) {
                form.setFieldsValue({ employee_id: selectedEmployee.employee_id });
              }
              setOpen(true);
            }}
            disabled={!selectedEmployee}
          >
            Record Attrition
          </Button>
        </div>
      </div>

      {/* Show table only when an employee is selected */}
      {selectedEmployee && (
        <Table
          columns={columns}
          dataSource={attritionRecords.filter(r => r.employee_id === selectedEmployee.employee_id)}
          rowKey="id"
          loading={loading}
        />
      )}

      {/* Show message when no employee is selected */}
      {!selectedEmployee && (
        <div style={{ textAlign: 'center', padding: '32px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Please select an employee to view their attrition history</p>
        </div>
      )}

      <Modal
        title={editingRecord ? "Edit Attrition Record" : "Record Attrition"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item 
            name="employee_id" 
            label="Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select 
              showSearch
              disabled={!!editingRecord || !!selectedEmployee}
              placeholder="Search by ID or Name"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
              options={employees.map(emp => ({
                value: emp.employee_id,
                label: `${emp.employee_id} - ${emp.employee_name}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Leaving"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select>
              {ATTRITION_REASONS.map(reason => (
                <Select.Option key={reason} value={reason}>
                  {formatReason(reason)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="last_working_date"
            label="Last Working Date"
            rules={[{ required: true, message: 'Please select last working date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingRecord ? 'Update' : 'Record'} Attrition
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Attrition; 