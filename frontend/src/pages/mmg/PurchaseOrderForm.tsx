import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, message, Card } from 'antd';
import { api } from '../../services/api';

interface PurchaseOrderFormProps {
  procurementId: number;
  onSuccess: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ procurementId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await api.post(`/mmg/procurements/${procurementId}/purchase-order`, {
        ...values,
        po_date: values.po_date.toISOString(),
      });
      message.success('Purchase Order saved successfully!');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Failed to save PO:', error);
      message.error('Failed to save Purchase Order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Enter Purchase Order Details" style={{ marginTop: 16 }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="po_number" label="Purchase Order (PO) Number" rules={[{ required: true }]}>
          <Input placeholder="e.g., CDAC/PO/2024/001" />
        </Form.Item>
        <Form.Item name="po_date" label="PO Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="vendor" label="Vendor / Supplier" rules={[{ required: true }]}>
          <Input placeholder="Vendor from GeM or Tender" />
        </Form.Item>
        <Form.Item name="notes" label="Notes / Remarks">
          <Input.TextArea rows={2} placeholder="Any specific instructions or notes." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Purchase Order
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PurchaseOrderForm; 