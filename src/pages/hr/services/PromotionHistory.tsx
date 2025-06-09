import React, { useState, useEffect } from 'react';
import { Form, message, Input, Button, Select, DatePicker, Modal, Table, Space, Timeline, InputNumber, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../../utils/api';
import dayjs from 'dayjs';

interface Designation {
  designation_id: number;
  designation: string;
}

interface Employee {
  employee_id: number;
  employee_name: string;
  initial_designation_id: number;
  designation_id: number;
}

interface Promotion {
  id: number;
  employee_id: number;
  from_designation_id: number;
  to_designation_id: number;
  employee_name: string;
  old_designation: string;
  new_designation: string;
  effective_date: string;
  remarks: string;
  level: number;
}

interface PromotionFormData {
  effective_date: string;
  from_designation_id: number;
  to_designation_id: number;
  level: number;
  remarks?: string;
}

const PromotionHistory: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [promotionForms, setPromotionForms] = useState<PromotionFormData[]>([{
    effective_date: '',
    from_designation_id: 0,
    to_designation_id: 0,
    level: 0,
    remarks: ''
  }]);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDesignations();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchPromotions();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/hr/employees');
      setEmployees(response.data);
    } catch (error) {
      message.error('Failed to fetch employees');
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await api.get('/hr/designations');
      setDesignations(response.data);
    } catch (error) {
      message.error('Failed to fetch designations');
    }
  };

  const fetchPromotions = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
      const response = await api.get(`/hr/services/promotions?employee_id=${selectedEmployee.employee_id}`);
      setPromotions(response.data);
    } catch (error) {
      message.error('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (employeeId: number) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    setSelectedEmployee(employee || null);
  };

  const addPromotionForm = () => {
    setPromotionForms([...promotionForms, {
      effective_date: '',
      from_designation_id: 0,
      to_designation_id: 0,
      level: 0,
      remarks: ''
    }]);
  };

  const removePromotionForm = (index: number) => {
    const newForms = [...promotionForms];
    newForms.splice(index, 1);
    setPromotionForms(newForms);
  };

  const handleSubmit = async (values: any) => {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
      const promotions = values.promotions.map((p: any) => ({
        to_designation_id: p.to_designation_id,
        effective_date: p.effective_date.format('YYYY-MM-DD'),
        level: p.level,
        remarks: p.remarks || null
      }));

      const response = await api.post('/hr/services/promotions/bulk', {
        employee_id: selectedEmployee.employee_id,
        promotions
      });

      message.success('Promotions saved successfully');
      fetchPromotions();
      setOpen(false);
      form.resetFields();
      setPromotionForms([{
        effective_date: '',
        from_designation_id: 0,
        to_designation_id: 0,
        level: 0,
        remarks: ''
      }]);
    } catch (error: any) {
      if (error.response?.data?.lastPromotionDate) {
        message.error(`New promotions must be after ${dayjs(error.response.data.lastPromotionDate).format('DD/MM/YYYY')}`);
      } else {
        message.error('Failed to save promotions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Promotion) => {
    setEditingPromotion(record);
    setEditModalVisible(true);
    form.setFieldsValue({
      effective_date: dayjs(record.effective_date),
      to_designation_id: record.to_designation_id,
      level: record.level,
      remarks: record.remarks
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hr/services/promotions/${id}`);
      message.success('Promotion deleted successfully');
      fetchPromotions();
    } catch (error) {
      message.error('Failed to delete promotion');
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingPromotion) return;
    try {
      await api.put(`/hr/services/promotions/${editingPromotion.id}`, {
        to_designation_id: values.to_designation_id,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        level: values.level,
        remarks: values.remarks || null
      });
      message.success('Promotion updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      fetchPromotions();
    } catch (error: any) {
      if (error.response?.data?.lastPromotionDate) {
        message.error(`New promotion date must be after ${dayjs(error.response.data.lastPromotionDate).format('DD/MM/YYYY')}`);
      } else {
        message.error('Failed to update promotion');
      }
    }
  };

  const columns = [
    {
      title: 'Effective Date',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a: Promotion, b: Promotion) => dayjs(a.effective_date).unix() - dayjs(b.effective_date).unix(),
    },
    {
      title: 'From Designation',
      dataIndex: 'old_designation',
      key: 'from_designation',
    },
    {
      title: 'To Designation',
      dataIndex: 'new_designation',
      key: 'to_designation',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Promotion) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this promotion?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>Promotion History</h2>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', maxWidth: '600px' }}>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Search employee by ID or name"
            optionFilterProp="children"
            value={selectedEmployee?.employee_id}
            onChange={handleEmployeeChange}
            filterOption={(input, option) =>
              option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
            options={employees.map(emp => ({
              value: emp.employee_id,
              label: `${emp.employee_id} - ${emp.employee_name}`
            }))}
            allowClear
            onClear={() => setSelectedEmployee(null)}
          />
          <Button 
            type="primary"
            onClick={() => setOpen(true)}
            disabled={!selectedEmployee}
          >
            Add Multiple Promotions
          </Button>
        </div>
      </div>

      {selectedEmployee ? (
        <>
          <Table
            columns={columns}
            dataSource={promotions}
            rowKey="id"
            loading={loading}
          />
          
          <div style={{ marginTop: '24px' }}>
            <Timeline mode="left">
              {promotions.map((promotion) => (
                <Timeline.Item 
                  key={promotion.id}
                  label={dayjs(promotion.effective_date).format('DD/MM/YYYY')}
                >
                  {`${promotion.old_designation} → ${promotion.new_designation} (Level ${promotion.level})`}
                  {promotion.remarks && <div style={{ color: '#666' }}>{promotion.remarks}</div>}
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Please select an employee to view their promotion history</p>
        </div>
      )}

      {/* Add Multiple Promotions Modal */}
      <Modal
        title="Add Multiple Promotions"
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setPromotionForms([{
            effective_date: '',
            from_designation_id: 0,
            to_designation_id: 0,
            level: 0,
            remarks: ''
          }]);
        }}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          {promotionForms.map((_, index) => (
            <div key={index} style={{ 
              border: '1px solid #f0f0f0', 
              padding: '16px', 
              marginBottom: '16px',
              borderRadius: '8px',
              position: 'relative'
            }}>
              <div style={{ marginBottom: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                <strong>Promotion {index + 1}</strong>
                {index > 0 && (
                  <Button 
                    type="link" 
                    danger 
                    onClick={() => removePromotionForm(index)}
                    style={{ position: 'absolute', right: '16px', top: '16px' }}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <Form.Item
                name={['promotions', index, 'effective_date']}
                label="Effective Date"
                rules={[{ required: true, message: 'Please select effective date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name={['promotions', index, 'from_designation_id']}
                label="From Designation"
                rules={[{ required: true, message: 'Please select from designation' }]}
              >
                <Select>
                  {designations.map(d => (
                    <Select.Option key={d.designation_id} value={d.designation_id}>
                      {d.designation}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name={['promotions', index, 'to_designation_id']}
                label="To Designation"
                rules={[{ required: true, message: 'Please select to designation' }]}
              >
                <Select>
                  {designations.map(d => (
                    <Select.Option key={d.designation_id} value={d.designation_id}>
                      {d.designation}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name={['promotions', index, 'level']}
                label="Level"
                rules={[{ required: true, message: 'Please enter level' }]}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name={['promotions', index, 'remarks']}
                label="Remarks"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </div>
          ))}

          <div style={{ marginBottom: '24px' }}>
            <Button type="dashed" onClick={addPromotionForm} block>
              + Add Another Promotion
            </Button>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save All Promotions
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Promotion"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleEditSubmit} layout="vertical">
          <Form.Item
            name="effective_date"
            label="Effective Date"
            rules={[{ required: true, message: 'Please select effective date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="to_designation_id"
            label="To Designation"
            rules={[{ required: true, message: 'Please select to designation' }]}
          >
            <Select>
              {designations.map(d => (
                <Select.Option key={d.designation_id} value={d.designation_id}>
                  {d.designation}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Please enter level' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Promotion
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionHistory; 