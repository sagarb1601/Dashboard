import React, { useState, useEffect } from 'react';
import { Table, Card, message, Tag, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface Payment {
  id: number;
  entity_id: number;
  po_id: number;
  payment_date: string;
  amount: number;
  status: string;
  remarks?: string;
  billing_start_date?: string;
  billing_end_date?: string;
  entity_name: string;
  client_name: string;
  invoice_no: string;
}

const PaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        message.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      message.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const columns: ColumnsType<Payment> = [
    {
      title: 'Entity',
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
      title: 'Invoice No',
      dataIndex: 'invoice_no',
      key: 'invoice_no',
      sorter: (a, b) => a.invoice_no.localeCompare(b.invoice_no),
    },
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      sorter: (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime(),
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => amount.toLocaleString(),
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
        { text: 'Received', value: 'received' },
        { text: 'Pending', value: 'pending' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
  ];

  const filteredPayments = payments.filter(payment =>
    payment.entity_name.toLowerCase().includes(searchText.toLowerCase()) ||
    payment.client_name.toLowerCase().includes(searchText.toLowerCase()) ||
    payment.invoice_no.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '12px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Payments ({filteredPayments.length})</h3>
          <Search
            placeholder="Search payments..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredPayments}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} payments`,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default PaymentsTab; 