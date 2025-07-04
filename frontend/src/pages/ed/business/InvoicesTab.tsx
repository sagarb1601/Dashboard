import React, { useState, useEffect } from 'react';
import { Table, Card, message, Tag, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface Invoice {
  po_id: number;
  invoice_no: string;
  entity_name: string;
  client_name: string;
  invoice_date: string;
  invoice_value: number;
  status: string;
  payment_mode: string;
  payment_duration: string;
}

const InvoicesTab: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
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
        setInvoices(data);
      } else {
        message.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to fetch invoices');
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

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoice_no',
      key: 'invoice_no',
      sorter: (a, b) => a.invoice_no.localeCompare(b.invoice_no),
      render: (text) => <strong>{text}</strong>,
    },
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
      title: 'Invoice Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      sorter: (a, b) => new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime(),
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'invoice_value',
      key: 'invoice_value',
      sorter: (a, b) => a.invoice_value - b.invoice_value,
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
        { text: 'Payment Pending', value: 'Payment Pending' },
        { text: 'Partial Payment', value: 'Partial Payment' },
        { text: 'Paid Completely', value: 'Paid Completely' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_no.toLowerCase().includes(searchText.toLowerCase()) ||
    invoice.entity_name.toLowerCase().includes(searchText.toLowerCase()) ||
    invoice.client_name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '12px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Invoices ({filteredInvoices.length})</h3>
          <Search
            placeholder="Search invoices..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredInvoices}
          rowKey="po_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} invoices`,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default InvoicesTab; 