import React, { useState, useEffect } from 'react';
import { Form, message, Input, Button, Select, DatePicker, Modal, Table, Space } from 'antd';
import api from '../../../utils/api';
import dayjs from 'dayjs';

// Helper function to format dates
const formatDate = (date: string | null) => {
  if (!date) return '';
  const dateObj = dayjs(date);
  return dateObj.format('DD/MM/YYYY');
};

// Helper function to check if date is month end
const isMonthEnd = (date: dayjs.Dayjs) => {
  const nextDay = date.add(1, 'day');
  return date.month() !== nextDay.month();
};

interface Employee {
  employee_id: number;
  employee_name: string;
  technical_group_id: number;
}

interface TechnicalGroup {
  group_id: number;
  group_name: string;
  group_description: string;
}

interface GroupTransferRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  from_group_id: number | null;
  to_group_id: number;
  from_group_name: string | null;
  to_group_name: string;
  transfer_date: string;
  remarks: string;
}

const GroupTransfer: React.FC = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [technicalGroups, setTechnicalGroups] = useState<TechnicalGroup[]>([]);
  const [transfers, setTransfers] = useState<GroupTransferRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<GroupTransferRecord | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/hr/employees');
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to fetch employees');
    }
  };

  const fetchTechnicalGroups = async () => {
    try {
      const response = await api.get('/hr/technical_groups');
      console.log('Fetched technical groups:', response.data);
      setTechnicalGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching technical groups:', error);
      message.error('Failed to fetch technical groups');
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/hr/services/transfers');
      setTransfers(response.data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      message.error('Failed to fetch transfer history');
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTechnicalGroups();
    fetchTransfers();
  }, []);

  const handleEmployeeChange = async (employeeId: number) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    setSelectedEmployee(employee || null);

    // Get employee details including join date
    try {
      const employeeDetails = await api.get(`/hr/employees/${employeeId}`);
      if (employeeDetails.data) {
        form.setFieldValue('transfer_date', dayjs(employeeDetails.data.join_date));
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const postData = {
        ...values,
        transfer_date: values.transfer_date.format('YYYY-MM-DD')
      };
      
      if (editingTransfer) {
        const response = await api.put(`/hr/services/transfers/${editingTransfer.id}`, postData);
        if (response.data) {
          message.success('Transfer updated successfully');
          form.resetFields();
          setOpen(false);
          setEditingTransfer(null);
          setSelectedEmployee(null);
          fetchTransfers();
        }
      } else {
        const employeeTransfers = transfers
          .filter(t => t.employee_id === values.employee_id)
          .sort((a, b) => new Date(a.transfer_date).getTime() - new Date(b.transfer_date).getTime());

        let from_group_id;
        if (employeeTransfers.length > 0) {
          // Use the latest transfer's to_group_id
          from_group_id = employeeTransfers[employeeTransfers.length - 1].to_group_id;
        } else {
          // For first transfer, use employee's current group
          from_group_id = selectedEmployee?.technical_group_id;
        }

        const newPostData = {
          ...postData,
          from_group_id,
          to_group_id: values.to_group_id
        };

        const response = await api.post('/hr/services/transfers', newPostData);
        if (response.data) {
          message.success('Transfer added successfully');
          form.resetFields();
          setOpen(false);
          setSelectedEmployee(null);
          fetchTransfers();
        }
      }
    } catch (error: any) {
      console.error('Error saving transfer:', error);
      let errorMessage = 'An error occurred';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid transfer data. Please check the dates and groups.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error - Please check transfer dates.';
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterOption = (input: string, option: any) => {
    const value = option?.children || '';
    return value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredEmployees = employees.filter(emp => {
    const searchValue = searchText.toLowerCase();
    return (
      emp.employee_id.toString().includes(searchValue) ||
      emp.employee_name.toLowerCase().includes(searchValue)
    );
  });

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hr/services/transfers/${id}`);
      message.success('Transfer record deleted successfully');
      fetchTransfers();
    } catch (error: any) {
      console.error('Error deleting transfer:', error);
      message.error(error.response?.data?.message || 'Failed to delete transfer record');
    }
  };

  const columns = [
    { 
      title: 'Employee', 
      key: 'employee',
      render: (record: GroupTransferRecord) => `${record.employee_id} - ${record.employee_name}`
    },
    { 
      title: 'From Group', 
      dataIndex: 'from_group_name', 
      key: 'from_group_name',
      render: (text: string | null) => text || 'Initial Group'
    },
    { title: 'To Group', dataIndex: 'to_group_name', key: 'to_group_name' },
    { 
      title: 'Transfer Date', 
      dataIndex: 'transfer_date',
      key: 'transfer_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: GroupTransferRecord) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              setEditingTransfer(record);
              form.setFieldsValue({
                employee_id: record.employee_id,
                to_group_id: record.to_group_id,
                transfer_date: dayjs(record.transfer_date),
                remarks: record.remarks
              });
              const employee = employees.find(e => e.employee_id === record.employee_id);
              setSelectedEmployee(employee || null);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              Modal.confirm({
                title: 'Delete Transfer Record',
                content: 'Are you sure you want to delete this transfer record? This action cannot be undone.',
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
      )
    }
  ];

  const getCurrentGroupName = () => {
    if (!selectedEmployee) return '';
    
    const latestTransfer = transfers
      .filter(t => t.employee_id === selectedEmployee.employee_id)
      .sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime())[0];

    if (latestTransfer) {
      return latestTransfer.to_group_name;
    }

    const currentGroup = technicalGroups.find(g => g.group_id === selectedEmployee.technical_group_id);
    return currentGroup?.group_name || '';
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>Group Transfer History</h2>
        <Button 
          type="primary" 
          onClick={() => {
            setEditingTransfer(null);
            setSelectedEmployee(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          Record Transfer
        </Button>
      </div>

      <Table 
        dataSource={transfers} 
        columns={columns}
        rowKey="id"
      />

      <Modal
        title={editingTransfer ? "Edit Transfer" : "Record Transfer"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingTransfer(null);
          setSelectedEmployee(null);
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
            name="employee_id" 
            label="Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select 
              showSearch
              onChange={handleEmployeeChange}
              disabled={!!editingTransfer}
              placeholder="Search by ID or Name"
              filterOption={filterOption}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            >
              {filteredEmployees.map(emp => (
                <Select.Option key={emp.employee_id} value={emp.employee_id}>
                  {`${emp.employee_id} - ${emp.employee_name}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selectedEmployee && (
            <Form.Item label="Current Group">
              <Input 
                value={editingTransfer ? (editingTransfer.from_group_name || '') : getCurrentGroupName()}
                disabled 
              />
            </Form.Item>
          )}

          <Form.Item 
            name="to_group_id" 
            label="New Group"
            rules={[
              { required: true, message: 'Please select a group' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const currentGroupId = selectedEmployee?.technical_group_id;
                  if (!value) {
                    return Promise.reject('Please select a group');
                  }
                  if (value === currentGroupId) {
                    return Promise.reject('New group must be different from current group');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Select
              placeholder="Select new group"
              disabled={!selectedEmployee}
            >
              {technicalGroups
                .filter(group => {
                  if (editingTransfer) {
                    return group.group_id !== editingTransfer.from_group_id;
                  }
                  return group.group_id !== selectedEmployee?.technical_group_id;
                })
                .map(group => (
                  <Select.Option 
                    key={group.group_id} 
                    value={group.group_id}
                  >
                    {group.group_name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="transfer_date" 
            label="Transfer Date"
            rules={[{ required: true, message: 'Please select transfer date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingTransfer ? 'Update Transfer' : 'Record Transfer'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupTransfer; 