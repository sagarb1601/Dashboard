import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Descriptions, Typography, Card, Table, Timeline, Spin, Alert, Row, Col, Tag, Button, Space, message, Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { api } from '../../services/api';
import moment from 'moment';

const { Text } = Typography;
const { Option } = Select;

interface Procurement {
  id: number;
  indent_number: string;
  title: string;
  status: string;
  project_id: number;
  group_id: number;
  purchase_type: string;
  delivery_place: string;
  estimated_cost: number;
  indent_date: string;
  mmg_acceptance_date: string;
  created_at: string;
  items: any[];
  history: any[];
}

interface Bid {
  id: number;
  vendor_name: string;
  bid_amount: number;
  number_of_bids: number;
  notes?: string;
  created_at: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  po_date: string;
  vendor_name: string;
  po_value: number;
  status: string;
  payment_completion_date?: string;
}

const ProcurementDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [procurement, setProcurement] = useState<Procurement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [poLoading, setPoLoading] = useState(false);
  
  // Modal states
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [poModalVisible, setPoModalVisible] = useState(false);
  const [finalizeModalVisible, setFinalizeModalVisible] = useState(false);
  const [bidForm] = Form.useForm();
  const [poForm] = Form.useForm();
  const [finalizeForm] = Form.useForm();

  const fetchProcurementDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mmg/procurements/${id}`);
      setProcurement(response.data);
      
      // Fetch bids and purchase orders
      fetchBids();
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch procurement details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      setBidsLoading(true);
      const response = await api.get(`/mmg/procurements/${id}/bids`);
      setBids(response.data);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setBidsLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setPoLoading(true);
      const response = await api.get(`/mmg/procurements/${id}/purchase-orders`);
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    } finally {
      setPoLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurementDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddBid = async (values: any) => {
    try {
      message.loading({ content: 'Adding bid...', key: 'addBid' });
      
      await api.post(`/mmg/procurements/${id}/bids`, {
        vendor_name: values.vendor_name,
        bid_amount: values.bid_amount,
        notes: values.notes
      });
      
      setBidModalVisible(false);
      bidForm.resetFields();
      fetchBids();
      fetchProcurementDetails(); // Refresh to get updated status
      
      message.success({ content: 'Bid added successfully.', key: 'addBid' });
    } catch (err: any) {
      message.error({ 
        content: err.response?.data?.message || 'Failed to add bid.', 
        key: 'addBid' 
      });
    }
  };

  const handleFinalizeVendor = async (values: any) => {
    try {
      message.loading({ content: 'Finalizing vendor...', key: 'finalizeVendor' });
      
      await api.post(`/mmg/procurements/${id}/finalize-vendor`, {
        bid_id: values.bid_id,
        finalization_date: values.finalization_date.format('YYYY-MM-DD')
      });
      
      setFinalizeModalVisible(false);
      finalizeForm.resetFields();
      fetchProcurementDetails();
      
      message.success({ content: 'Vendor finalized successfully.', key: 'finalizeVendor' });
    } catch (err: any) {
      message.error({ 
        content: err.response?.data?.message || 'Failed to finalize vendor.', 
        key: 'finalizeVendor' 
      });
    }
  };

  const handleCreatePO = async (values: any) => {
    try {
      message.loading({ content: 'Creating purchase order...', key: 'createPO' });
      
      await api.post(`/mmg/procurements/${id}/purchase-order`, {
        po_number: values.po_number,
        po_date: values.po_date.format('YYYY-MM-DD'),
        po_value: values.po_value,
        po_creation_date: values.po_creation_date.format('YYYY-MM-DD')
      });
      
      setPoModalVisible(false);
      poForm.resetFields();
      fetchPurchaseOrders();
      fetchProcurementDetails();
      
      message.success({ content: 'Purchase order created successfully.', key: 'createPO' });
    } catch (err: any) {
      message.error({ 
        content: err.response?.data?.message || 'Failed to create purchase order.', 
        key: 'createPO' 
      });
    }
  };

  const handleUpdatePOStatus = async (poId: number, newStatus: string) => {
    try {
      message.loading({ content: 'Updating PO status...', key: 'updatePOStatus' });
      
      const requestData: any = {
        status: newStatus,
        status_update_date: new Date().toISOString().split('T')[0]
      };
      
      // If marking as Payment Processed, prompt for payment completion date
      if (newStatus === 'Payment Processed') {
        const paymentDate = prompt('Enter payment completion date (YYYY-MM-DD):');
        if (!paymentDate) {
          message.error({ content: 'Payment completion date is required.', key: 'updatePOStatus' });
          return;
        }
        requestData.payment_completion_date = paymentDate;
      }
      
      await api.put(`/mmg/procurements/purchase-order/${poId}/status`, requestData);
      
      fetchPurchaseOrders();
      fetchProcurementDetails();
      
      message.success({ content: 'PO status updated successfully.', key: 'updatePOStatus' });
    } catch (err: any) {
      message.error({ 
        content: err.response?.data?.message || 'Failed to update PO status.', 
        key: 'updatePOStatus' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Indent Received': 'blue',
      'Accepted by MMG': 'green',
      'Rejected': 'red',
      'Item Found in GeM': 'cyan',
      'Order Placed in GeM': 'purple',
      'Tender Called': 'orange',
      'Bids Received': 'purple',
      'Vendor Finalized': 'geekblue',
      'PO Created': 'lime',
      'Payment Processed': 'gold',
      'Item Received': 'green',
      'Successful': 'green',
      'Failed': 'red'
    };
    return statusColors[status] || 'default';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading procurement details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={() => window.location.href = '/mmg/procurements'}>
            Back to List
          </Button>
        }
      />
    );
  }

  if (!procurement) {
    return <Alert message="Procurement not found" type="error" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/mmg/procurements">← Back to Procurement List</Link>
      </div>

      <Card title="Procurement Details" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Indent Number">{procurement.indent_number}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(procurement.status)}>{procurement.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Title">{procurement.title}</Descriptions.Item>
          <Descriptions.Item label="Purchase Type">{procurement.purchase_type}</Descriptions.Item>
          <Descriptions.Item label="Delivery Place">{procurement.delivery_place}</Descriptions.Item>
          <Descriptions.Item label="Estimated Cost">₹{procurement.estimated_cost?.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Indent Date">
            {procurement.indent_date ? moment(procurement.indent_date).format('DD/MM/YYYY') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="MMG Acceptance Date">
            {procurement.mmg_acceptance_date ? moment(procurement.mmg_acceptance_date).format('DD/MM/YYYY') : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginBottom: 16 }}>
        <Space wrap>
          {procurement.status === 'Order Placed in GeM' && (
            <>
              <Button type="primary" onClick={() => setBidModalVisible(true)}>
                Add GeM Bid
              </Button>
              <Link to={`/mmg/procurements`}>
                <Button>Update Status</Button>
              </Link>
            </>
          )}
          {procurement.status === 'Tender Called' && (
            <>
              <Button type="primary" onClick={() => setBidModalVisible(true)}>
                Add Bid
              </Button>
              <Link to={`/mmg/procurements`}>
                <Button>Update Status</Button>
              </Link>
            </>
          )}
          {procurement.status === 'Bids Received' && (
            <>
              <Button type="primary" onClick={() => setBidModalVisible(true)}>
                Add More Bids
              </Button>
              <Button onClick={() => setFinalizeModalVisible(true)}>
                Finalize Vendor
              </Button>
            </>
          )}
          {procurement.status === 'Vendor Finalized' && (
            <Button type="primary" onClick={() => setPoModalVisible(true)}>
              Create Purchase Order
            </Button>
          )}
          <Link to="/mmg/procurements">
            <Button>Back to List</Button>
          </Link>
        </Space>
      </Card>

      {/* Workflow Guidance */}
      <Card title="Next Steps" style={{ marginBottom: 16 }}>
        {procurement.status === 'Indent Received' && (
          <Alert
            message="Action Required"
            description="This indent has been received. Please update the status to 'Accepted by MMG' to proceed with procurement."
            type="info"
            showIcon
          />
        )}
        {procurement.status === 'Accepted by MMG' && (
          <Alert
            message="Action Required"
            description="Indent accepted. Please update status to either 'Item Found in GeM' (if using GeM portal) or 'Tender Called' (if calling for tenders)."
            type="info"
            showIcon
          />
        )}
        {procurement.status === 'Item Found in GeM' && (
          <Alert
            message="Action Required"
            description="Item found in GeM portal. Please update status to 'Order Placed in GeM' when order is placed in GeM."
            type="info"
            showIcon
          />
        )}
        {procurement.status === 'Order Placed in GeM' && (
          <Alert
            message="Action Required"
            description="Order placed in GeM. Please add the GeM vendor details as a bid, then manually update status to 'Bids Received'."
            type="info"
            showIcon
            action={
              <Button type="primary" size="small" onClick={() => setBidModalVisible(true)}>
                Add GeM Bid
              </Button>
            }
          />
        )}
        {procurement.status === 'Tender Called' && (
          <Alert
            message="Action Required"
            description="Tender has been called. Please add bids received from vendors, then manually update status to 'Bids Received'."
            type="info"
            showIcon
            action={
              <Button type="primary" size="small" onClick={() => setBidModalVisible(true)}>
                Add Bid
              </Button>
            }
          />
        )}
        {procurement.status === 'Bids Received' && (
          <Alert
            message="Action Required"
            description="Bids have been received. Please finalize a vendor and update status to 'Vendor Finalized'."
            type="info"
            showIcon
            action={
              <Button type="primary" size="small" onClick={() => setFinalizeModalVisible(true)}>
                Finalize Vendor
              </Button>
            }
          />
        )}
        {procurement.status === 'Vendor Finalized' && (
          <Alert
            message="Action Required"
            description="Vendor has been finalized. Please create a purchase order and update status to 'PO Created'."
            type="info"
            showIcon
            action={
              <Button type="primary" size="small" onClick={() => setPoModalVisible(true)}>
                Create PO
              </Button>
            }
          />
        )}
        {procurement.status === 'PO Created' && (
          <Alert
            message="Action Required"
            description="Purchase order has been created. Update status to 'Payment Processed' when payment is completed, then to 'Item Received' when items are received."
            type="success"
            showIcon
          />
        )}
        {procurement.status === 'Payment Processed' && (
          <Alert
            message="Action Required"
            description="Payment has been processed. Update status to 'Item Received' when items are physically received."
            type="success"
            showIcon
          />
        )}
        {procurement.status === 'Item Received' && (
          <Alert
            message="Action Required"
            description="Items have been received. Update status to 'Successful' if procurement completed successfully, or 'Failed' if there were issues."
            type="success"
            showIcon
          />
        )}
        {procurement.status === 'Successful' && (
          <Alert
            message="Completed Successfully"
            description="This procurement has been completed successfully."
            type="success"
            showIcon
          />
        )}
        {procurement.status === 'Failed' && (
          <Alert
            message="Procurement Failed"
            description="This procurement has failed. Please review and take necessary actions."
            type="error"
            showIcon
          />
        )}
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Items" size="small">
            <Table
              dataSource={procurement.items}
              columns={[
                { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Specifications', dataIndex: 'specifications', key: 'specifications' }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="History" size="small">
            <Timeline>
              {procurement.history.map((event, index) => (
                <Timeline.Item key={index}>
                  <div>
                    <div><strong>{event.new_status}</strong></div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {moment(event.status_date).format('DD/MM/YYYY HH:mm')}
                    </div>
                    {event.remarks && <div style={{ fontSize: '12px' }}>{event.remarks}</div>}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Bids Section */}
      {['Order Placed in GeM', 'Tender Called', 'Bids Received', 'Vendor Finalized', 'PO Created', 'Payment Processed', 'Item Received', 'Successful', 'Failed'].includes(procurement.status) && (
        <Card title="Bids" style={{ marginTop: 16 }}>
          <Table
            dataSource={bids}
            loading={bidsLoading}
            columns={[
              { title: 'Vendor', dataIndex: 'vendor_name', key: 'vendor_name' },
              { title: 'Bid Amount', dataIndex: 'bid_amount', key: 'bid_amount', 
                render: (amount) => `₹${amount?.toLocaleString()}` },
              { title: 'Number of Bids', dataIndex: 'number_of_bids', key: 'number_of_bids' },
              { title: 'Notes', dataIndex: 'notes', key: 'notes' },
              { title: 'Date', dataIndex: 'created_at', key: 'created_at',
                render: (date) => moment(date).format('DD/MM/YYYY') }
            ]}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Purchase Orders Section */}
      {['PO Created', 'Payment Processed', 'Item Received', 'Successful', 'Failed'].includes(procurement.status) && (
        <Card title="Purchase Orders" style={{ marginTop: 16 }}>
          <Table
            dataSource={purchaseOrders}
            loading={poLoading}
            columns={[
              { title: 'PO Number', dataIndex: 'po_number', key: 'po_number' },
              { title: 'PO Date', dataIndex: 'po_date', key: 'po_date',
                render: (date) => moment(date).format('DD/MM/YYYY') },
              { title: 'Vendor', dataIndex: 'vendor_name', key: 'vendor_name' },
              { title: 'Amount', dataIndex: 'po_value', key: 'po_value',
                render: (amount) => `₹${amount?.toLocaleString()}` },
              { title: 'Status', dataIndex: 'status', key: 'status',
                render: (status) => <Tag color={status === 'Pending' ? 'orange' : 'green'}>{status}</Tag> },
              { title: 'Payment Date', dataIndex: 'payment_completion_date', key: 'payment_completion_date',
                render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'N/A' },
              { title: 'Actions', key: 'actions',
                render: (_, record) => (
                  record.status === 'Pending' ? (
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => handleUpdatePOStatus(record.id, 'Payment Processed')}
                    >
                      Mark Payment Processed
                    </Button>
                  ) : null
                )
              }
            ]}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Add Bid Modal */}
      <Modal
        title={procurement.status === 'Order Placed in GeM' ? "Add GeM Bid" : "Add Bid"}
        open={bidModalVisible}
        onCancel={() => setBidModalVisible(false)}
        footer={null}
      >
        <Form form={bidForm} onFinish={handleAddBid} layout="vertical">
          <Form.Item
            name="number_of_bids"
            label="Number of Bids"
            rules={[{ required: true, message: 'Please enter number of bids' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter number of bids received"
              min={1}
            />
          </Form.Item>
          <Form.Item
            name="vendor_name"
            label="Vendor Name"
            rules={[{ required: true, message: 'Please enter vendor name' }]}
          >
            <Input placeholder="Enter vendor name" />
          </Form.Item>
          <Form.Item
            name="bid_amount"
            label="Bid Amount"
            rules={[{ required: true, message: 'Please enter bid amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter bid amount"
              min={0}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea placeholder="Enter notes (optional)" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Bid
              </Button>
              <Button onClick={() => setBidModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Finalize Vendor Modal */}
      <Modal
        title="Finalize Vendor"
        open={finalizeModalVisible}
        onCancel={() => setFinalizeModalVisible(false)}
        footer={null}
      >
        <Form form={finalizeForm} onFinish={handleFinalizeVendor} layout="vertical">
          <Form.Item
            name="bid_id"
            label="Select Vendor"
            rules={[{ required: true, message: 'Please select a vendor' }]}
          >
            <Select placeholder="Select vendor to finalize">
              {bids.map(bid => (
                <Option key={bid.id} value={bid.id}>
                  {bid.vendor_name} - ₹{bid.bid_amount?.toLocaleString()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="finalization_date"
            label="Finalization Date"
            rules={[{ required: true, message: 'Please select finalization date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Finalize Vendor
              </Button>
              <Button onClick={() => setFinalizeModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Purchase Order Modal */}
      <Modal
        title="Create Purchase Order"
        open={poModalVisible}
        onCancel={() => setPoModalVisible(false)}
        footer={null}
      >
        <Form form={poForm} onFinish={handleCreatePO} layout="vertical">
          <Form.Item
            name="po_number"
            label="PO Number"
            rules={[{ required: true, message: 'Please enter PO number' }]}
          >
            <Input placeholder="Enter PO number" />
          </Form.Item>
          <Form.Item
            name="po_date"
            label="PO Date"
            rules={[{ required: true, message: 'Please select PO date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="po_value"
            label="PO Amount"
            rules={[{ required: true, message: 'Please enter PO amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter PO amount"
              min={0}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item
            name="po_creation_date"
            label="PO Creation Date"
            rules={[{ required: true, message: 'Please select PO creation date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create PO
              </Button>
              <Button onClick={() => setPoModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProcurementDetails; 