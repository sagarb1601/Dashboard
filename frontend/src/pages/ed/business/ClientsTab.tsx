import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface Client {
  id: number;
  client_name: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  description?: string;
}

const ClientsTab: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        message.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      message.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Client> = [
    {
      title: 'Client Name',
      dataIndex: 'client_name',
      key: 'client_name',
      sorter: (a, b) => a.client_name.localeCompare(b.client_name),
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      sorter: (a, b) => a.contact_person.localeCompare(b.contact_person),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <a href={`mailto:${email}`}>{email}</a>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'contact_number',
      key: 'contact_number',
      render: (phone) => (
        <a href={`tel:${phone}`}>{phone}</a>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(searchText.toLowerCase()) ||
    client.contact_person.toLowerCase().includes(searchText.toLowerCase()) ||
    client.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '12px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Clients ({filteredClients.length})</h3>
          <Search
            placeholder="Search clients..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredClients}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} clients`,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default ClientsTab; 