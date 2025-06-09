import React from 'react';
import { Modal, Form, Button, Space, Alert } from 'antd';
import { FormInstance } from 'antd/lib/form';

interface FormModalProps {
  title: string;
  open: boolean;
  onCancel: () => void;
  form: FormInstance;
  onFinish: (values: any) => void;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  width?: number;
}

const FormModal: React.FC<FormModalProps> = ({
  title,
  open,
  onCancel,
  form,
  onFinish,
  loading = false,
  error = null,
  children,
  width = 520,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={width}
      maskClosable={false}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}
      
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
      >
        {children}

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FormModal; 