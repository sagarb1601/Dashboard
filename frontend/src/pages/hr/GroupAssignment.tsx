import React, { useState, useEffect } from 'react';
import { Table, Select, Button, message, Typography, Card, Space, Tag } from 'antd';
import { hrAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface Employee {
  employee_id: number;
  employee_name: string;
  designation: string;
  designation_full: string;
  join_date: string;
  employee_type?: string;
}

interface TechnicalGroup {
  group_id: number;
  group_name: string;
  group_description: string;
}

const GroupAssignment: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [technicalGroups, setTechnicalGroups] = useState<TechnicalGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesResponse, groupsResponse] = await Promise.all([
        hrAPI.getEmployeesWithoutGroup(),
        hrAPI.getTechnicalGroups()
      ]);
      
      setEmployees(employeesResponse.data);
      setTechnicalGroups(groupsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignGroup = async (employeeId: number, groupId: number) => {
    try {
      setAssigning(prev => ({ ...prev, [employeeId]: true }));
      
      await hrAPI.assignGroupToEmployee(employeeId, groupId);
      
      message.success(`Group assigned successfully to employee ${employeeId}`);
      
      // Remove the employee from the list
      setEmployees(prev => prev.filter(emp => emp.employee_id !== employeeId));
    } catch (error) {
      console.error('Error assigning group:', error);
      message.error('Failed to assign group');
    } finally {
      setAssigning(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
    },
    {
      title: 'Employee Name',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 200,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 150,
      render: (designation: string, record: Employee) => (
        <div>
          <div>{designation}</div>
          {record.designation_full && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.designation_full}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'join_date',
      key: 'join_date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Employee Type',
      dataIndex: 'employee_type',
      key: 'employee_type',
      width: 150,
      render: (type: string) => type ? <Tag color="blue">{type}</Tag> : <Tag color="orange">Not specified</Tag>,
    },
    {
      title: 'Technical Group',
      key: 'technical_group',
      width: 250,
      render: (record: Employee) => (
        <Space>
          <Select
            placeholder="Select group"
            style={{ width: 200 }}
            disabled={assigning[record.employee_id]}
          >
            {technicalGroups.map(group => (
              <Option key={group.group_id} value={group.group_id}>
                {group.group_name} - {group.group_description}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            size="small"
            loading={assigning[record.employee_id]}
            onClick={(e) => {
              const select = e.currentTarget.previousElementSibling as HTMLElement;
              const selectElement = select?.querySelector('.ant-select-selector') as HTMLElement;
              if (selectElement) {
                const value = (selectElement as any).value;
                if (value) {
                  handleAssignGroup(record.employee_id, value);
                } else {
                  message.warning('Please select a group first');
                }
              }
            }}
          >
            Assign
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3}>Assign Technical Groups</Title>
        <Text type="secondary">
          Assign technical groups to employees who don't have one assigned. 
          Employees uploaded without a group will appear here.
        </Text>
        
        <div style={{ marginTop: 16 }}>
          <Table
            dataSource={employees}
            columns={columns}
            rowKey="employee_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} employees without group assignment`,
            }}
            scroll={{ x: 1000 }}
          />
        </div>

        {employees.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">
              No employees found without group assignment. All employees have been assigned to technical groups.
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GroupAssignment; 