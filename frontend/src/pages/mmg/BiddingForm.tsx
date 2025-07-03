import React, { useState } from 'react';
import { Form, Input, Button, InputNumber, message, Card } from 'antd';
import { api } from '../../services/api';

interface BiddingFormProps {
  procurementId: number;
  onSuccess: () => void; // To refresh the details page
}

const BiddingForm: React.FC<BiddingFormProps> = ({ procurementId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await api.post(`/mmg/procurements/${procurementId}/bids`, values);
      message.success('Bidding details saved successfully!');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Failed to save bidding details:', error);
      message.error('Failed to save bidding details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Enter Bidding Details" style={{ marginTop: 16 }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="tender_number" label="Tender Number">
          <Input placeholder="e.g., C-DAC/MMG/2024/T-001" />
        </Form.Item>
        <Form.Item name="bids_received_count" label="Number of Bids Received">
          <InputNumber min={0} style={{ width: '100%' }}/>
        </Form.Item>
        <Form.Item name="finalized_vendor" label="Finalized Vendor" rules={[{ required: true, message: 'Please enter the finalized vendor' }]}>
          <Input placeholder="e.g., Global Tech Inc." />
        </Form.Item>
        <Form.Item name="notes" label="Notes / Remarks">
          <Input.TextArea rows={2} placeholder="e.g., Selected based on lowest price and matching specs." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Bidding Details
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BiddingForm; 