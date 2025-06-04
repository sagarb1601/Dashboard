import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, Table, message, InputNumber, Modal } from 'antd';
import api from '../../utils/api';
import dayjs from 'dayjs';

interface TrainingRecord {
  id: number;
  training_type: string;
  training_topic: string;
  start_date: string;
  end_date: string;
  venue: string;
  attended_count: number;
  training_mode: string;
  guest_lecture_name: string;
  lecturer_details: string;
  created_at: string;
}

const Training: React.FC = () => {
  const [form] = Form.useForm();
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingRecord | null>(null);
  const [open, setOpen] = useState(false);

  const trainingTypes = [
    'TECHNICAL',
    'MENTAL_HEALTH',
    'SPECIAL_TECHNICAL_TRAINING',
    'WORK_LIFE_BALANCE'
  ];

  const fetchTrainings = async () => {
    try {
      const response = await api.get('/hr/services/trainings');
      setTrainings(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch trainings');
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const data = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
      };

      if (editingTraining) {
        await api.put(`/hr/services/trainings/${editingTraining.id}`, data);
        message.success('Training updated successfully');
      } else {
        await api.post('/hr/services/trainings', data);
        message.success('Training added successfully');
      }

      form.resetFields();
      setEditingTraining(null);
      setOpen(false);
      fetchTrainings();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save training');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hr/services/trainings/${id}`);
      message.success('Training deleted successfully');
      fetchTrainings();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete training');
    }
  };

  const columns = [
    { 
      title: 'Type', 
      dataIndex: 'training_type', 
      key: 'training_type',
      render: (type: string) => type.replace(/_/g, ' ')
    },
    { title: 'Topic', dataIndex: 'training_topic', key: 'training_topic' },
    { 
      title: 'Start Date', 
      dataIndex: 'start_date', 
      key: 'start_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    { 
      title: 'End Date', 
      dataIndex: 'end_date', 
      key: 'end_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    { title: 'Venue', dataIndex: 'venue', key: 'venue' },
    { title: 'Attended Count', dataIndex: 'attended_count', key: 'attended_count' },
    { title: 'Mode', dataIndex: 'training_mode', key: 'training_mode' },
    { title: 'Guest Lecture Name', dataIndex: 'guest_lecture_name', key: 'guest_lecture_name' },
    { title: 'Lecturer Details', dataIndex: 'lecturer_details', key: 'lecturer_details' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TrainingRecord) => (
        <>
          <Button 
            type="link" 
            onClick={() => {
              setEditingTraining(record);
              form.setFieldsValue({
                ...record,
                start_date: dayjs(record.start_date),
                end_date: dayjs(record.end_date)
              });
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>Training Records</h2>
        <Button 
          type="primary" 
          onClick={() => {
            setEditingTraining(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          Add Training
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={trainings}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />

      <Modal
        title={editingTraining ? 'Edit Training' : 'Add Training'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingTraining(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="training_type"
            label="Training Type"
            rules={[{ required: true, message: 'Please select training type' }]}
          >
            <Select>
              {trainingTypes.map(type => (
                <Select.Option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="training_topic"
            label="Training Topic"
            rules={[{ required: true, message: 'Please enter training topic' }]}
          >
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="start_date"
              label="Start Date"
              rules={[{ required: true, message: 'Please select start date' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="end_date"
              label="End Date"
              rules={[{ required: true, message: 'Please select end date' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="venue"
            label="Venue"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="attended_count"
            label="Attended Count"
            rules={[{ required: true, message: 'Please enter attended count' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="training_mode"
            label="Training Mode"
            rules={[{ required: true, message: 'Please enter training mode' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="guest_lecture_name"
            label="Guest Lecture Name"
            rules={[{ required: true, message: 'Please enter guest lecture name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="lecturer_details"
            label="Lecturer Details"
            rules={[{ required: true, message: 'Please enter lecturer details' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingTraining ? 'Update' : 'Add'} Training
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Training; 