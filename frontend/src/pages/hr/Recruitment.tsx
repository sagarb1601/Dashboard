import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Select, Table, message, InputNumber, Modal } from 'antd';
import api from '../../utils/api';
import dayjs from 'dayjs';

interface RecruitmentRecord {
  id: number;
  recruitment_mode: string;
  year: number;
  month: number;
  recruited_count: number;
  created_at: string;
}

const Recruitment: React.FC = () => {
  const [form] = Form.useForm();
  const [recruitments, setRecruitments] = useState<RecruitmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecruitment, setEditingRecruitment] = useState<RecruitmentRecord | null>(null);
  const [open, setOpen] = useState(false);

  const recruitmentModes = ['ACTS', 'OFF_CAMPUS', 'OPEN_AD'];
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const fetchRecruitments = async () => {
    try {
      const response = await api.get('/hr/services/recruitments');
      setRecruitments(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch recruitments');
    }
  };

  useEffect(() => {
    fetchRecruitments();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingRecruitment) {
        await api.put(`/hr/services/recruitments/${editingRecruitment.id}`, values);
        message.success('Recruitment updated successfully');
      } else {
        await api.post('/hr/services/recruitments', values);
        message.success('Recruitment added successfully');
      }

      form.resetFields();
      setEditingRecruitment(null);
      setOpen(false);
      fetchRecruitments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save recruitment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hr/services/recruitments/${id}`);
      message.success('Recruitment deleted successfully');
      fetchRecruitments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete recruitment');
    }
  };

  // Add a function to group recruitments by month and year
  const groupedRecruitments = useMemo(() => {
    const groups: { [key: string]: { [mode: string]: number } } = {};
    
    recruitments.forEach(record => {
      const key = `${record.year}-${record.month}`;
      if (!groups[key]) {
        groups[key] = {};
      }
      groups[key][record.recruitment_mode] = record.recruited_count;
    });

    return Object.entries(groups).map(([key, modes]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        key,
        year,
        month,
        monthName: months.find(m => m.value === month)?.label,
        ...modes,
        total: Object.values(modes).reduce((sum, count) => sum + count, 0)
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [recruitments]);

  const columns = [
    { 
      title: 'Month', 
      dataIndex: 'monthName',
      key: 'month',
      render: (text: string, record: any) => `${text} ${record.year}`
    },
    ...recruitmentModes.map(mode => ({
      title: mode.replace(/_/g, ' '),
      dataIndex: mode,
      key: mode,
      render: (count: number) => count || 0
    })),
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <strong>{total}</strong>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Button 
          type="link" 
          onClick={() => {
            // Find all recruitments for this month/year
            const monthRecruitments = recruitments.filter(
              r => r.year === record.year && r.month === record.month
            );
            // Open modal with all recruitments for editing
            setEditingRecruitment(monthRecruitments[0]);
            form.setFieldsValue(monthRecruitments[0]);
            setOpen(true);
          }}
        >
          Edit
        </Button>
      )
    }
  ];

  const currentYear = dayjs().year();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>Recruitment Summary</h2>
        <Button 
          type="primary" 
          onClick={() => {
            setEditingRecruitment(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          Add Recruitment
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={groupedRecruitments}
        rowKey="key"
        pagination={{ pageSize: 12 }}
      />

      <Modal
        title={editingRecruitment ? 'Edit Recruitment' : 'Add Recruitment'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingRecruitment(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="recruitment_mode"
            label="Recruitment Mode"
            rules={[{ required: true, message: 'Please select recruitment mode' }]}
          >
            <Select>
              {recruitmentModes.map(mode => (
                <Select.Option key={mode} value={mode}>
                  {mode.replace(/_/g, ' ')}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="month"
            label="Month"
            rules={[{ required: true, message: 'Please select month' }]}
          >
            <Select>
              {months.map(month => (
                <Select.Option key={month.value} value={month.value}>
                  {month.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: 'Please select year' }]}
          >
            <Select>
              {years.map(year => (
                <Select.Option key={year} value={year}>
                  {year}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="recruited_count"
            label="Recruited Count"
            rules={[{ required: true, message: 'Please enter recruited count' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingRecruitment ? 'Update' : 'Add'} Recruitment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Recruitment; 