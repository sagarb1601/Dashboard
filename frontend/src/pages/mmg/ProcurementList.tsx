import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Alert, Button, Modal, message, Popconfirm, Form, Select, Input, DatePicker } from 'antd';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import CreateProcurementForm from './CreateProcurementForm';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Define the type for a single procurement request
interface Procurement {
  id: number;
  indent_number: string;
  title: string;
  status: string;
  estimated_cost: number;
  indent_date: string;
  created_at: string;
}

const ProcurementList: React.FC = () => {
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);
  const [statusForm] = Form.useForm();

  const fetchProcurements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mmg/procurements');
      setProcurements(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch procurement requests. You may not have the required permissions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurements();
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCreateSuccess = () => {
    setIsModalVisible(false);
    fetchProcurements(); // Refresh the list after successful creation
  };

  const handleDelete = async (id: number) => {
    try {
      message.loading({ content: 'Deleting procurement...', key: 'deleteProcurement' });
      
      await api.delete(`/mmg/procurements/${id}`);
      
      message.success({ content: 'Procurement deleted successfully.', key: 'deleteProcurement' });
      
      // Refresh the list
      fetchProcurements();
    } catch (err: any) {
      message.error({ 
        content: err.response?.data?.message || 'Failed to delete procurement.', 
        key: 'deleteProcurement' 
      });
      console.error(err);
    }
  };

  const showStatusModal = (procurement: Procurement) => {
    setSelectedProcurement(procurement);
    statusForm.resetFields();
    setStatusModalVisible(true);
  };

  const handleStatusUpdate = async (values: any) => {
    if (!selectedProcurement) return;

    try {
      message.loading({ content: 'Updating status...', key: 'statusUpdate' });
      
      await api.post(`/mmg/procurements/${selectedProcurement.id}/status`, { 
        status: values.status,
        remarks: values.remarks,
        status_date: values.status_date.format('YYYY-MM-DD')
      });
      
      message.success({ content: 'Status updated successfully.', key: 'statusUpdate' });
      
      setStatusModalVisible(false);
      fetchProcurements();
    } catch (err) {
      message.error({ content: 'Failed to update status.', key: 'statusUpdate' });
      console.error(err);
    }
  };

  const statusOptions = [
    { value: 'Indent Received', label: 'Indent Received' },
    { value: 'Accepted by MMG', label: 'Accepted by MMG' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Item Found in GeM', label: 'Item Found in GeM' },
    { value: 'Order Placed in GeM', label: 'Order Placed in GeM' },
    { value: 'Tender Called', label: 'Tender Called' },
    { value: 'Bids Received', label: 'Bids Received' },
    { value: 'Vendor Finalized', label: 'Vendor Finalized' },
    { value: 'PO Created', label: 'PO Created' },
    { value: 'Payment Processed', label: 'Payment Processed' },
    { value: 'Item Received', label: 'Item Received' },
    { value: 'Successful', label: 'Successful' },
    { value: 'Failed', label: 'Failed' }
  ];

  const columns = [
    { title: 'Indent Number', dataIndex: 'indent_number', key: 'indent_number' },
    { 
      title: 'Title', 
      dataIndex: 'title', 
      key: 'title',
      render: (text: string, record: Procurement) => (
        <Link to={`/mmg/procurements/${record.id}`}>{text}</Link>
      ),
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
        let color = 'geekblue';
        if (status.toLowerCase().includes('approved') || status.toLowerCase().includes('accepted')) color = 'green';
        if (status.toLowerCase().includes('rejected') || status.toLowerCase().includes('failed')) color = 'volcano';
        if (status.toLowerCase().includes('successful')) color = 'green';
        if (status.toLowerCase().includes('closed')) color = 'gold';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    { title: 'Estimated Cost', dataIndex: 'estimated_cost', key: 'estimated_cost', render: (cost: number) => `₹${cost?.toLocaleString()}` },
    { title: 'Date Raised', dataIndex: 'indent_date', key: 'indent_date', render: (date:string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Procurement) => {
        const canDelete = ['Indent Received', 'Rejected'].includes(record.status);
        
        return (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to={`/mmg/procurements/${record.id}`}>
              <Button type="link" size="small">View</Button>
            </Link>
            <Button 
              type="link" 
              size="small"
              onClick={() => showStatusModal(record)}
            >
              Update Status
            </Button>
            {canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this procurement?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger size="small">Delete</Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>MMG - Procurement Requests</Title>
        <Button type="primary" onClick={showModal}>
          Create Indent
        </Button>
      </div>
      {error && <Alert message="Error" description={error} type="error" showIcon closable style={{ marginBottom: 16 }} />}
      <Table
        columns={columns}
        dataSource={procurements}
        loading={loading}
        rowKey="id"
      />
      <Modal
        title="Create New Procurement Indent"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null} // The form will have its own submit/cancel buttons
        destroyOnClose
        width={800} // Make modal wider for the form
        style={{ zIndex: 1000 }}
        maskStyle={{ zIndex: 999 }}
      >
        <CreateProcurementForm onSuccess={handleCreateSuccess} onCancel={handleCancel} />
      </Modal>

      {/* Status Update Modal */}
      <Modal
        title="Update Procurement Status"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={statusForm} onFinish={handleStatusUpdate} layout="vertical">
          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select placeholder="Select new status">
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status_date"
            label="Status Date"
            rules={[{ required: true, message: 'Please select status date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="YYYY-MM-DD"
              placeholder="Select status date"
            />
          </Form.Item>
          
          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <TextArea 
              rows={3} 
              placeholder="Enter remarks (optional)"
            />
          </Form.Item>
          
          <Form.Item>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button onClick={() => setStatusModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Status
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProcurementList; 