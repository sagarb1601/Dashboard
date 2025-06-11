import React, { useState, useEffect } from 'react';
import { Form, message, Input, InputNumber, Button, Select, Modal, Table, Space } from 'antd';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import api from '../../../utils/api';
import dayjs, { Dayjs } from 'dayjs';

interface Promotion {
  id: number;
  employee_id: number;
  from_designation_id: number;
  to_designation_id: number;
  employee_name: string;
  old_designation: string;
  new_designation: string;
  effective_date: string;
  remarks: string;
  level: number;
  promotion_type?: 'REGULAR' | 'SPECIAL' | 'MACP' | 'NFSG' | 'OTHER';
  promotion_order?: number;
  pay_level?: number;
  pay_matrix_cell?: number;
  order_reference?: string;
  order_date?: string;
}

interface PromotionFormValues {
  employee_id: number;
  to_designation_id: number;
  level: number;
  effective_date: Dayjs;
  remarks?: string;
  promotion_type?: Promotion['promotion_type'];
  pay_level?: number;
  pay_matrix_cell?: number;
  order_reference?: string;
  order_date?: Dayjs;
}

interface Employee {
  employee_id: number;
  employee_name: string;
  initial_designation_id: number;
  designation_id: number;
  join_date: string;
}

interface Designation {
  designation_id: number;
  designation: string;
  designation_full?: string;
}

interface Promotion {
  id: number;
  employee_id: number;
  from_designation_id: number;
  to_designation_id: number;
  employee_name: string;
  old_designation: string;
  new_designation: string;
  effective_date: string;
  remarks: string;
  level: number;
}

interface FilterOption {
  label?: string;
  value?: string | number;
}

const Promotions: React.FC = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dateConstraints, setDateConstraints] = useState<{
    minDate?: string;
    maxDate?: string;
  }>({});

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await api.get('/hr/employees');
      if (!response.data || response.data.length === 0) {
        message.warning('No employees found');
      }
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to fetch employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      setLoadingDesignations(true);
      const response = await api.get('/hr/designations');
      if (!response.data || response.data.length === 0) {
        message.warning('No designations found');
      }
      setDesignations(response.data);
    } catch (error) {
      console.error('Error fetching designations:', error);
      message.error('Failed to fetch designations');
    } finally {
      setLoadingDesignations(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoadingPromotions(true);
      const response = await api.get('/hr/services/promotions');
      if (!response.data || response.data.length === 0) {
        console.log('No promotions found');
      }
      setPromotions(response.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      message.error('Failed to fetch promotions');
    } finally {
      setLoadingPromotions(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDesignations();
    fetchPromotions();
  }, []);

  const handleEmployeeChange = async (employeeId: number) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    setSelectedEmployee(employee || null);

    // Get employee's join date for minimum date validation
    if (employee) {
        const employeeDetails = await api.get(`/hr/employees/${employeeId}`);
        setDateConstraints({
            minDate: employeeDetails.data.join_date // Only restrict dates before join date
        });
    }
  };

  const handleEdit = (record: Promotion) => {
    setEditingPromotion(record);
    
    // Only restrict dates before join date
    const employee = employees.find(e => e.employee_id === record.employee_id);
    if (employee) {
        setDateConstraints({
            minDate: employee.join_date
        });
    }
    
    form.setFieldsValue({
      employee_id: record.employee_id,
      to_designation_id: record.to_designation_id,
      level: record.level,
      effective_date: new Date(record.effective_date),
      remarks: record.remarks
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hr/services/promotions/${id}`);
      message.success('Promotion record deleted successfully');
      fetchPromotions();
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      message.error(error.response?.data?.message || 'Failed to delete promotion record');
    }
  };

  const handleSubmit = async (values: PromotionFormValues) => {
    try {
      setSubmitting(true);
      const postData = {
        ...values,
        effective_date: dayjs(values.effective_date).format('YYYY-MM-DD')
      };
      
      if (editingPromotion) {
        const response = await api.put(`/hr/services/promotions/${editingPromotion.id}`, postData);
        if (response.data) {
          message.success('Promotion updated successfully');
          form.resetFields();
          setOpen(false);
          setEditingPromotion(null);
          setSelectedEmployee(null);
          fetchPromotions();
        }
      } else {
        const employeePromotions = promotions
          .filter(p => p.employee_id === values.employee_id)
          .sort((a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());

        let from_designation_id;
        if (employeePromotions.length > 0) {
          from_designation_id = employeePromotions[employeePromotions.length - 1].to_designation_id;
        } else {
          from_designation_id = selectedEmployee?.initial_designation_id;
        }

        const newPostData = {
          ...postData,
          from_designation_id,
          to_designation_id: values.to_designation_id
        };

        const response = await api.post('/hr/services/promotions', newPostData);
        if (response.data) {
          message.success('Promotion added successfully');
          form.resetFields();
          setOpen(false);
          setSelectedEmployee(null);
          fetchPromotions();
        }
      }
    } catch (error: any) {
      console.error('Error submitting promotion:', error);
      message.error(error.response?.data?.message || 'Failed to submit promotion');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Employee ID', dataIndex: 'employee_id', key: 'employee_id' },
    { title: 'Employee Name', dataIndex: 'employee_name', key: 'employee_name' },
    { 
      title: 'Previous Designation', 
      dataIndex: 'old_designation', 
      key: 'old_designation',
      render: (text: string, record: Promotion) => {
        const designation = designations.find(d => d.designation_id === record.from_designation_id);
        return designation ? designation.designation : text;
      }
    },
    { 
      title: 'New Designation', 
      dataIndex: 'new_designation', 
      key: 'new_designation',
      render: (text: string, record: Promotion) => {
        const designation = designations.find(d => d.designation_id === record.to_designation_id);
        return designation ? designation.designation : text;
      }
    },
    { title: 'Level', dataIndex: 'level', key: 'level' },
    { 
      title: 'Effective Date', 
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Promotion) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              Modal.confirm({
                title: 'Delete Promotion Record',
                content: 'Are you sure you want to delete this promotion record? This action cannot be undone.',
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>Employee Promotions</h2>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', maxWidth: '600px' }}>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder={loadingEmployees ? 'Loading employees...' : 'Search employee by ID or name'}
            optionFilterProp="children"
            value={selectedEmployee?.employee_id}
            onChange={handleEmployeeChange}
            filterOption={(input: string, option?: FilterOption) =>
              option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
            options={employees.map(emp => ({
              value: emp.employee_id,
              label: `${emp.employee_id} - ${emp.employee_name}`
            }))}
            allowClear
            onClear={() => setSelectedEmployee(null)}
            loading={loadingEmployees}
            disabled={loadingEmployees}
          />
          <Button 
            type="primary"
            onClick={() => {
              setEditingPromotion(null);
              form.resetFields();
              if (selectedEmployee) {
                form.setFieldsValue({ employee_id: selectedEmployee.employee_id });
              }
              setOpen(true);
            }}
            disabled={!selectedEmployee || loadingPromotions}
          >
            Add Promotion
          </Button>
        </div>
      </div>

      {selectedEmployee && (
        <Table
          columns={columns}
          dataSource={promotions.filter(p => p.employee_id === selectedEmployee.employee_id)}
          rowKey="id"
          loading={loadingPromotions}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      )}

      {!selectedEmployee && (
        <div style={{ textAlign: 'center', padding: '32px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Please select an employee to view their promotion history</p>
        </div>
      )}

      <Modal
        title={editingPromotion ? 'Edit Promotion' : 'Add Promotion'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingPromotion(null);
          form.resetFields();
        }}
        footer={null}
        maskClosable={false}
        confirmLoading={submitting}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="employee_id"
            label="Employee"
            rules={[
              { required: true, message: 'Please select an employee' },
              { type: 'number', message: 'Employee ID must be a number' }
            ]}
          >
            <Select
              showSearch
              placeholder="Select employee"
              optionFilterProp="children"
              disabled={!!editingPromotion || !!selectedEmployee}
              filterOption={(input: string, option?: FilterOption) =>
                option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
              options={employees.map(emp => ({
                value: emp.employee_id,
                label: `${emp.employee_id} - ${emp.employee_name}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="to_designation_id"
            label="New Designation"
            rules={[
              { required: true, message: 'Please select new designation' },
              { type: 'number', message: 'Designation ID must be a number' },
              {
                validator: async (_, value) => {
                  if (selectedEmployee) {
                    const currentDesignation = selectedEmployee.designation_id;
                    if (value === currentDesignation) {
                      throw new Error('New designation must be different from current designation');
                    }
                  }
                }
              }
            ]}
          >
            <Select
              showSearch
              placeholder="Select new designation"
              optionFilterProp="children"
              filterOption={(input: string, option?: FilterOption) =>
                option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
              options={designations.map(des => ({
                value: des.designation_id,
                label: des.designation
              }))}
            />
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[
              { required: true, message: 'Please enter level' },
              { type: 'number', message: 'Level must be a number' },
              { min: 1, message: 'Level must be at least 1' }
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="effective_date"
            label="Effective Date"
            rules={[
              { required: true, message: 'Please select effective date' },
              {
                validator: async (_, value) => {
                  if (value) {
                    const selectedDate = dayjs(value);
                    const today = dayjs();
                    if (selectedDate.isAfter(today)) {
                      throw new Error('Effective date cannot be in the future');
                    }
                  }
                }
              }
            ]}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker 
                slotProps={{
                  textField: { 
                    style: { width: '100%' },
                    size: "small"
                  }
                }}
                shouldDisableDate={(date: Date | Dayjs) => {
                  if (!dateConstraints.minDate) return false;
                  const current = dayjs(date);
                  return current.isBefore(dayjs(dateConstraints.minDate));
                }}
              />
            </LocalizationProvider>
          </Form.Item>

          <Form.Item
            name="promotion_type"
            label="Promotion Type"
            rules={[{ required: true, message: 'Please select promotion type' }]}
          >
            <Select
              placeholder="Select promotion type"
              options={[
                { value: 'REGULAR', label: 'Regular' },
                { value: 'SPECIAL', label: 'Special' },
                { value: 'MACP', label: 'MACP' },
                { value: 'NFSG', label: 'NFSG' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="pay_level"
            label="Pay Level"
            rules={[
              { type: 'number', message: 'Pay level must be a number' },
              { min: 1, message: 'Pay level must be at least 1' }
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="pay_matrix_cell"
            label="Pay Matrix Cell"
            rules={[
              { type: 'number', message: 'Pay matrix cell must be a number' },
              { min: 1, message: 'Pay matrix cell must be at least 1' }
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="order_reference"
            label="Order Reference"
            rules={[
              { max: 100, message: 'Order reference cannot exceed 100 characters' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="order_date"
            label="Order Date"
            rules={[
              {
                validator: async (_, value) => {
                  if (value) {
                    const orderDate = dayjs(value);
                    const effectiveDate = form.getFieldValue('effective_date');
                    if (effectiveDate && orderDate.isAfter(effectiveDate)) {
                      throw new Error('Order date cannot be after effective date');
                    }
                  }
                }
              }
            ]}
          >
            <DatePicker sx={{ width: '100%' }} />
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
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingPromotion ? 'Update' : 'Add'} Promotion
              </Button>
              <Button onClick={() => {
                setOpen(false);
                setEditingPromotion(null);
                form.resetFields();
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

export default Promotions; 