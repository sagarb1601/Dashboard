import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Input, Select, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { format } from 'date-fns';
import { SearchOutlined } from '@ant-design/icons';
import { IconWrapper } from '../../../utils/IconWrapper';

const { Search } = Input;
const { Option } = Select;

interface ContractorData {
  contractor_id: number;
  contractor_company_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  mappings: {
    contract_id: number;
    department_name: string;
    start_date: string;
    end_date: string;
    status: 'ACTIVE' | 'INACTIVE' | 'UPCOMING';
  }[];
}

const WrappedSearchIcon = IconWrapper(SearchOutlined);

const ContractorList: React.FC = () => {
  const [contractors, setContractors] = useState<ContractorData[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<ContractorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/admin/contractors');
        const mappingsResponse = await axios.get('/api/admin/contractor-mappings');
        
        const contractorsWithMappings = response.data.map((contractor: ContractorData) => ({
          ...contractor,
          mappings: mappingsResponse.data.filter(
            (m: any) => m.contractor_id === contractor.contractor_id
          ),
        }));
        
        setContractors(contractorsWithMappings);
        setFilteredContractors(contractorsWithMappings);
      } catch (error) {
        console.error('Error fetching contractors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...contractors];

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(contractor => 
        contractor.contractor_company_name.toLowerCase().includes(searchLower) ||
        contractor.contact_person.toLowerCase().includes(searchLower) ||
        contractor.phone.includes(searchLower) ||
        (contractor.email && contractor.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(contractor =>
        contractor.mappings.some(mapping => statusFilter.includes(mapping.status))
      );
    }

    // Apply department filter
    if (departmentFilter.length > 0) {
      filtered = filtered.filter(contractor =>
        contractor.mappings.some(mapping => departmentFilter.includes(mapping.department_name))
      );
    }

    setFilteredContractors(filtered);
  }, [searchText, statusFilter, departmentFilter, contractors]);

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

  // Get unique departments from all mappings
  const departments = Array.from(new Set(
    contractors.flatMap(c => c.mappings.map(m => m.department_name))
  ));

  const columns: ColumnsType<ContractorData> = [
    {
      title: 'Company Name',
      dataIndex: 'contractor_company_name',
      key: 'contractor_company_name',
      sorter: (a, b) => a.contractor_company_name.localeCompare(b.contractor_company_name),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      sorter: (a, b) => a.contact_person.localeCompare(b.contact_person),
    },
    {
      title: 'Contact Details',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical">
          <div>{record.phone}</div>
          {record.email && <div>{record.email}</div>}
        </Space>
      ),
    },
    {
      title: 'Department Mappings',
      key: 'mappings',
      render: (_, record) => (
        <Space direction="vertical">
          {record.mappings.map((mapping) => (
            <div key={mapping.contract_id}>
              <Space>
                <span>{mapping.department_name}</span>
                <Tag color={getStatusColor(mapping.status)}>{mapping.status}</Tag>
                <span>
                  {format(new Date(mapping.start_date), 'dd MMM yyyy')} - {format(new Date(mapping.end_date), 'dd MMM yyyy')}
                </span>
              </Space>
            </div>
          ))}
          {record.mappings.length === 0 && <span style={{ color: '#999' }}>No mappings</span>}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Contractor List">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Search
            placeholder="Search by company, contact person, or contact details"
            allowClear
            onChange={e => setSearchText(e.target.value)}
            prefix={<WrappedSearchIcon />}
          />
        </Col>
        <Col xs={24} md={8}>
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
        <Col xs={24} md={8}>
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

      <Table
        columns={columns}
        dataSource={filteredContractors}
        rowKey="contractor_id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} contractors`,
        }}
      />
    </Card>
  );
};

export default ContractorList; 