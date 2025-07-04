import React, { useState, useEffect } from 'react';
import {
  Table,
  Typography,
  Card,
  message,
  Tag,
  Space,
  Select,
  Input,
  Row,
  Col
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface CombinedMMGData {
  id: number;
  indent_number: string;
  title: string;
  purchase_type: string;
  delivery_place: string;
  procurement_status: string;
  estimated_cost: number;
  indent_date: string;
  mmg_acceptance_date: string;
  sourcing_method: string;
  // Group and Indentor information
  group_name?: string;
  indentor_name?: string;
  // Bid information
  bid_vendor?: string;
  bid_amount?: number;
  bid_date?: string;
  number_of_bids?: number;
  // Purchase Order information
  po_number?: string;
  po_date?: string;
  po_value?: number;
  po_vendor?: string;
  po_status?: string;
  // Payment information
  payment_status?: string;
  payment_date?: string;
  payment_amount?: number;
}

const MMGIndentInfoPage: React.FC = () => {
  const [combinedData, setCombinedData] = useState<CombinedMMGData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<string>('all');

  const fetchCombinedMMGData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mmg/combined-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCombinedData(data);
      } else {
        message.error('Failed to fetch MMG data');
      }
    } catch (error) {
      console.error('Error fetching MMG data:', error);
      message.error('Failed to fetch MMG data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombinedMMGData();
  }, []);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('approved') || statusLower.includes('successful')) {
      return 'green';
    }
    if (statusLower.includes('pending') || statusLower.includes('in progress')) {
      return 'orange';
    }
    if (statusLower.includes('rejected') || statusLower.includes('failed') || statusLower.includes('cancelled')) {
      return 'red';
    }
    if (statusLower.includes('received') || statusLower.includes('accepted')) {
      return 'blue';
    }
    return 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('paid') || statusLower.includes('completed')) {
      return 'green';
    }
    if (statusLower.includes('pending') || statusLower.includes('partial')) {
      return 'orange';
    }
    if (statusLower.includes('overdue') || statusLower.includes('failed')) {
      return 'red';
    }
    return 'default';
  };

  const filteredData = combinedData.filter(item => {
    const matchesSearch = 
      item.indent_number.toLowerCase().includes(searchText.toLowerCase()) ||
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.group_name && item.group_name.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.indentor_name && item.indentor_name.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.bid_vendor && item.bid_vendor.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.po_vendor && item.po_vendor.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || item.procurement_status === statusFilter;
    const matchesPurchaseType = purchaseTypeFilter === 'all' || item.purchase_type === purchaseTypeFilter;
    
    return matchesSearch && matchesStatus && matchesPurchaseType;
  });

  const columns = [
    {
      title: 'Indent Number',
      dataIndex: 'indent_number',
      key: 'indent_number',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      fixed: 'left' as const,
      ellipsis: true,
    },
    {
      title: 'Group',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 120,
      fixed: 'left' as const,
      render: (group: string) => group || '-',
    },
    {
      title: 'Indentor',
      dataIndex: 'indentor_name',
      key: 'indentor_name',
      width: 120,
      fixed: 'left' as const,
      render: (indentor: string) => indentor || '-',
    },
    {
      title: 'Purchase Type',
      dataIndex: 'purchase_type',
      key: 'purchase_type',
      width: 120,
    },
    {
      title: 'Delivery Place',
      dataIndex: 'delivery_place',
      key: 'delivery_place',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'procurement_status',
      key: 'procurement_status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      width: 120,
      render: (cost: number) => cost ? `₹${cost.toLocaleString()}` : '-',
    },
    {
      title: 'Indent Date',
      dataIndex: 'indent_date',
      key: 'indent_date',
      width: 100,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Sourcing Method',
      dataIndex: 'sourcing_method',
      key: 'sourcing_method',
      width: 120,
    },
    {
      title: 'Bid Vendor',
      dataIndex: 'bid_vendor',
      key: 'bid_vendor',
      width: 150,
      render: (vendor: string) => vendor || '-',
    },
    {
      title: 'Bid Amount',
      dataIndex: 'bid_amount',
      key: 'bid_amount',
      width: 120,
      render: (amount: number) => amount ? `₹${amount.toLocaleString()}` : '-',
    },
    {
      title: 'Number of Bids',
      dataIndex: 'number_of_bids',
      key: 'number_of_bids',
      width: 100,
      render: (count: number) => count || '-',
    },
    {
      title: 'PO Number',
      dataIndex: 'po_number',
      key: 'po_number',
      width: 120,
      render: (po: string) => po || '-',
    },
    {
      title: 'PO Date',
      dataIndex: 'po_date',
      key: 'po_date',
      width: 100,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'PO Value',
      dataIndex: 'po_value',
      key: 'po_value',
      width: 120,
      render: (value: number) => value ? `₹${value.toLocaleString()}` : '-',
    },
    {
      title: 'PO Vendor',
      dataIndex: 'po_vendor',
      key: 'po_vendor',
      width: 150,
      render: (vendor: string) => vendor || '-',
    },
    {
      title: 'PO Status',
      dataIndex: 'po_status',
      key: 'po_status',
      width: 100,
      render: (status: string) => status ? (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ) : '-',
    },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 120,
      render: (status: string) => status ? (
        <Tag color={getPaymentStatusColor(status)}>{status}</Tag>
      ) : '-',
    },
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 100,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Payment Amount',
      dataIndex: 'payment_amount',
      key: 'payment_amount',
      width: 120,
      render: (amount: number) => amount ? `₹${amount.toLocaleString()}` : '-',
    },
  ];

  const statusOptions = Array.from(new Set(combinedData.map(item => item.procurement_status))).sort();
  const purchaseTypeOptions = Array.from(new Set(combinedData.map(item => item.purchase_type))).sort();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by indent number, title, group, indentor, vendor..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ maxWidth: 400 }}
              />
            </Col>
            <Col>
              <Select
                placeholder="Filter by Status"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="all">All Status</Option>
                <Option value="Pending">Pending</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Rejected">Rejected</Option>
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Filter by Purchase Type"
                value={purchaseTypeFilter}
                onChange={setPurchaseTypeFilter}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="all">All Types</Option>
                <Option value="Equipment">Equipment</Option>
                <Option value="Software">Software</Option>
                <Option value="Services">Services</Option>
                <Option value="Consumables">Consumables</Option>
              </Select>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 2200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default MMGIndentInfoPage; 