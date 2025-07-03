import React, { useState, useEffect } from 'react';
import { Table, Select, Button, message, Typography, Card, Space, Tag, Input, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { hrAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface Employee {
  employee_id: number;
  employee_name: string;
  designation: string;
  designation_full: string;
  join_date: string;
  employee_type?: string;
  technical_group_id?: number;
  group_name?: string;
  group_description?: string;
}

interface TechnicalGroup {
  group_id: number;
  group_name: string;
  group_description: string;
}

const GroupManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [technicalGroups, setTechnicalGroups] = useState<TechnicalGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<{ [key: number]: boolean }>({});
  const [searchText, setSearchText] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesResponse, groupsResponse] = await Promise.all([
        hrAPI.getEmployees(),
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

  const handleAssignGroup = async (employeeId: number, groupId: number | null) => {
    try {
      setAssigning(prev => ({ ...prev, [employeeId]: true }));
      
      if (groupId) {
        await hrAPI.assignGroupToEmployee(employeeId, groupId);
        message.success(`Group assigned successfully to employee ${employeeId}`);
      } else {
        // Remove group assignment
        await hrAPI.assignGroupToEmployee(employeeId, null);
        message.success(`Group removed from employee ${employeeId}`);
      }
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error assigning group:', error);
      message.error('Failed to assign group');
    } finally {
      setAssigning(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  // Filter employees based on search and group filter
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.employee_name.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.employee_id.toString().includes(searchText);
    
    const matchesGroup = filterGroup === 'all' || 
                        (filterGroup === 'unassigned' && !employee.technical_group_id) ||
                        (filterGroup === 'assigned' && employee.technical_group_id);
    
    return matchesSearch && matchesGroup;
  });

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 100,
    },
    {
      title: 'Employee Name',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 150,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 120,
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
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Employee Type',
      dataIndex: 'employee_type',
      key: 'employee_type',
      width: 120,
      render: (type: string) => type ? <Tag color="blue">{type}</Tag> : <Tag color="orange">Not specified</Tag>,
    },
    {
      title: 'Current Group',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 150,
      render: (groupName: string, record: Employee) => {
        if (record.technical_group_id && groupName) {
          return <Tag color="green">{groupName}</Tag>;
        } else {
          return <Tag color="orange">Not Assigned</Tag>;
        }
      }
    },
    {
      title: 'Update Group',
      key: 'update_group',
      width: 250,
      render: (record: Employee) => (
        <Space>
          <Select
            placeholder="Select group"
            style={{ width: 200 }}
            disabled={assigning[record.employee_id]}
            defaultValue={record.technical_group_id || undefined}
            onChange={(value) => handleAssignGroup(record.employee_id, value)}
          >
            <Option value={null}>Remove Group</Option>
            {technicalGroups.map(group => (
              <Option key={group.group_id} value={group.group_id}>
                {group.group_name} - {group.group_description}
              </Option>
            ))}
          </Select>
        </Space>
      ),
    },
  ];

  const getStats = () => {
    const total = employees.length;
    const assigned = employees.filter(emp => emp.technical_group_id).length;
    const unassigned = total - assigned;
    
    return { total, assigned, unassigned };
  };

  const stats = getStats();

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3}>Group Management</Title>
        <Text type="secondary">
          View and manage technical group assignments for all employees. 
          You can assign, change, or remove group assignments at any time.
        </Text>

        {/* Stats */}
        <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>{stats.total}</Title>
                <Text type="secondary">Total Employees</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>{stats.assigned}</Title>
                <Text type="secondary">With Groups</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#faad14' }}>{stats.unassigned}</Title>
                <Text type="secondary">Without Groups</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Search
              placeholder="Search by name or ID"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filter by group status"
              style={{ width: '100%' }}
              value={filterGroup}
              onChange={setFilterGroup}
            >
              <Option value="all">All Employees</Option>
              <Option value="assigned">With Groups</Option>
              <Option value="unassigned">Without Groups</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button 
              icon={<ReloadOutlined onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}} />} 
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
        
        <Table
          dataSource={filteredEmployees}
          columns={columns}
          rowKey="employee_id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} employees`,
          }}
          scroll={{ x: 1200 }}
        />

        {filteredEmployees.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">
              No employees found matching your criteria.
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GroupManagement; 