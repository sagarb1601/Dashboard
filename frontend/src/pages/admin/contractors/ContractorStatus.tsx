import React, { useEffect, useState } from 'react';
import type { TableProps } from 'antd';
import {
  Table,
  Tag,
  Space,
  Card,
  Typography,
  Alert,
  Tooltip,
  Row,
  Col,
  Statistic,
  Input,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { format } from 'date-fns';
import axios from 'axios';
import {
  SearchOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { IconWrapper } from '../../../utils/IconWrapper';
import type { Key } from 'react';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ContractorMapping {
  contract_id: number;
  contractor_id: number;
  department_id: number;
  start_date: string;
  end_date: string;
  contractor_company_name: string;
  department_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UPCOMING';
  days_remaining: number;
  alert_level: 'CRITICAL' | 'WARNING' | 'INFO' | 'NONE';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'INACTIVE':
      return 'red';
    case 'UPCOMING':
      return 'blue';
    default:
      return 'default';
  }
};

const getAlertColor = (alertLevel: string) => {
  switch (alertLevel) {
    case 'CRITICAL':
      return 'red';
    case 'WARNING':
      return 'orange';
    case 'INFO':
      return 'blue';
    default:
      return 'default';
  }
};

// Create wrapped icons
const WrappedSearchIcon = IconWrapper(SearchOutlined as React.ComponentType<any>);
const WrappedCheckCircleIcon = IconWrapper(CheckCircleOutlined as React.ComponentType<any>);
const WrappedWarningIcon = IconWrapper(WarningOutlined as React.ComponentType<any>);
const WrappedClockCircleIcon = IconWrapper(ClockCircleOutlined as React.ComponentType<any>);

const ContractorStatus: React.FC = () => {
  const [contractors, setContractors] = useState<ContractorMapping[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<ContractorMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const response = await axios.get('/api/admin/contractor-mappings');
        setContractors(response.data);
        setFilteredContractors(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch contractor data');
        console.error('Error fetching contractors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  useEffect(() => {
    let filtered = [...contractors];

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(contract => 
        contract.contractor_company_name.toLowerCase().includes(searchText.toLowerCase()) ||
        contract.department_name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(contract => statusFilter.includes(contract.status));
    }

    // Apply department filter
    if (departmentFilter.length > 0) {
      filtered = filtered.filter(contract => departmentFilter.includes(contract.department_name));
    }

    setFilteredContractors(filtered);
  }, [searchText, statusFilter, departmentFilter, contractors]);

  const departments = Array.from(new Set(contractors.map(c => c.department_name)));
  
  const statistics = {
    total: contractors.length,
    active: contractors.filter(c => c.status === 'ACTIVE').length,
    critical: contractors.filter(c => c.alert_level === 'CRITICAL').length,
    warning: contractors.filter(c => c.alert_level === 'WARNING').length,
  };

  const columns: ColumnsType<ContractorMapping> = [
    {
      title: 'Contractor',
      dataIndex: 'contractor_company_name',
      key: 'contractor_company_name',
      sorter: (a: ContractorMapping, b: ContractorMapping) => a.contractor_company_name.localeCompare(b.contractor_company_name),
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      sorter: (a: ContractorMapping, b: ContractorMapping) => a.department_name.localeCompare(b.department_name),
      filters: departments.map(dept => ({ text: dept, value: dept })),
      onFilter: (value: Key | boolean, record: ContractorMapping) => record.department_name === value,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: ContractorMapping) => (
        <Tag color={getStatusColor(record.status)}>
          {record.status}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' },
        { text: 'Upcoming', value: 'UPCOMING' },
      ],
      onFilter: (value: Key | boolean, record: ContractorMapping) => record.status === value,
    },
    {
      title: 'Contract Period',
      key: 'period',
      render: (_: unknown, record: ContractorMapping) => (
        <Space direction="vertical" size="small">
          <div>Start: {format(new Date(record.start_date), 'dd MMM yyyy')}</div>
          <div>End: {format(new Date(record.end_date), 'dd MMM yyyy')}</div>
        </Space>
      ),
    },
    {
      title: 'Days Remaining',
      key: 'days_remaining',
      render: (_: unknown, record: ContractorMapping) => {
        if (record.status === 'INACTIVE') return <Tag color="red">Expired</Tag>;
        if (record.status === 'UPCOMING') return <Tag color="blue">Not Started</Tag>;
        
        return (
          <Tooltip title={record.alert_level}>
            <Tag color={getAlertColor(record.alert_level)}>
              {record.days_remaining} days
            </Tag>
          </Tooltip>
        );
      },
      sorter: (a: ContractorMapping, b: ContractorMapping) => a.days_remaining - b.days_remaining,
    },
  ];

  const criticalContracts = filteredContractors.filter(c => c.alert_level === 'CRITICAL').length;
  const warningContracts = filteredContractors.filter(c => c.alert_level === 'WARNING').length;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>Contractor Status Dashboard</Title>
        
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Contracts"
                value={statistics.total}
                prefix={<WrappedSearchIcon />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Active Contracts"
                value={statistics.active}
                prefix={<WrappedCheckCircleIcon />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Critical Alerts"
                value={statistics.critical}
                prefix={<WrappedWarningIcon />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Warning Alerts"
                value={statistics.warning}
                prefix={<WrappedClockCircleIcon />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search contractors or departments"
              allowClear
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              mode="multiple"
              placeholder="Filter by status"
              style={{ width: '100%' }}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="UPCOMING">Upcoming</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              mode="multiple"
              placeholder="Filter by department"
              style={{ width: '100%' }}
              onChange={setDepartmentFilter}
              allowClear
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          {criticalContracts > 0 && (
            <Alert
              message={`Critical Alert: ${criticalContracts} contract${criticalContracts > 1 ? 's' : ''} ending within 7 days`}
              type="error"
              showIcon
            />
          )}
          {warningContracts > 0 && (
            <Alert
              message={`Warning: ${warningContracts} contract${warningContracts > 1 ? 's' : ''} ending within 30 days`}
              type="warning"
              showIcon
            />
          )}
        </Space>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={filteredContractors}
          rowKey="contract_id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} contracts`,
          }}
        />
      </Card>
    </Space>
  );
};

export default ContractorStatus; 