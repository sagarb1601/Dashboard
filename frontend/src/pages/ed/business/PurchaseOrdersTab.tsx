import React, { useState, useEffect } from 'react';
import { Table, Card, message, Tag, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface PurchaseOrder {
  po_id: number;
  entity_id: number;
  invoice_no: string;
  invoice_date: string;
  invoice_value: number;
  payment_duration: string;
  invoice_status: string;
  status: string;
  requested_by: number;
  payment_mode: string;
  remarks?: string;
  entity_name: string;
  entity_type: string;
  order_value: number;
  client_name: string;
  requested_by_name: string;
}

const PurchaseOrdersTab: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/purchase-orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      } else {
        message.error('Failed to fetch purchase orders');
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      message.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'payment pending': return 'warning';
      case 'partial payment': return 'processing';
      case 'paid completely': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoice_no',
      key: 'invoice_no',
      sorter: (a, b) => a.invoice_no.localeCompare(b.invoice_no),
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Entity Name',
      dataIndex: 'entity_name',
      key: 'entity_name',
      sorter: (a, b) => a.entity_name.localeCompare(b.entity_name),
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      sorter: (a, b) => a.client_name.localeCompare(b.client_name),
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      sorter: (a, b) => new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime(),
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Invoice Value',
      dataIndex: 'invoice_value',
      key: 'invoice_value',
      sorter: (a, b) => a.invoice_value - b.invoice_value,
      render: (value) => `₹${value.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Payment Pending', value: 'Payment Pending' },
        { text: 'Partial Payment', value: 'Partial Payment' },
        { text: 'Paid Completely', value: 'Paid Completely' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Requested By',
      dataIndex: 'requested_by_name',
      key: 'requested_by_name',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
  ];

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.invoice_no.toLowerCase().includes(searchText.toLowerCase()) ||
    po.entity_name.toLowerCase().includes(searchText.toLowerCase()) ||
    po.client_name.toLowerCase().includes(searchText.toLowerCase()) ||
    po.requested_by_name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '12px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Purchase Orders ({filteredPurchaseOrders.length})</h3>
          <Search
            placeholder="Search purchase orders..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredPurchaseOrders}
          rowKey="po_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} purchase orders`,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default PurchaseOrdersTab; 