import React, { useState, useEffect } from 'react';
import { Form, message, Input, Button, Select, DatePicker, Modal, Table, Space, Timeline, InputNumber, Upload } from 'antd';
import api from '../../../utils/api';
import dayjs from 'dayjs';
import type { UploadProps } from 'antd';
import { UploadOutlined, ExclamationCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface Employee {
  employee_id: number;
  employee_name: string;
  initial_designation_id: number;
  designation_id: number;
}

interface Designation {
  designation_id: number;
  designation: string;
  level: number;
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

interface BulkImportSuccess {
  employee_id: number;
  promotion_id: number;
}

interface BulkImportFailure {
  employee_id: number;
  error: string;
}

interface BulkImportResponse {
  successful: BulkImportSuccess[];
  failed: BulkImportFailure[];
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
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

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

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/hr/services/promotions/template', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'promotion_template.xlsx';
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download template');
    }
  };

  const handleBulkUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<BulkImportResponse>('/hr/services/promotions/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data) throw new Error('No response data');

      const { successful, failed } = response.data;

      if (successful.length > 0) {
        message.success(`Successfully imported ${successful.length} promotions`);
      }

      if (failed.length > 0) {
        Modal.error({
          title: 'Some promotions failed to import',
          content: (
            <div>
              <p>{`Failed to import ${failed.length} promotions:`}</p>
              <ul>
                {failed.map((failure, index) => (
                  <li key={index}>Employee ID {failure.employee_id}: {failure.error}</li>
                ))}
              </ul>
            </div>
          )
        });
      }

      // Refresh the promotion list if we're viewing the employee that was updated
      if (selectedEmployee && successful.some((s: BulkImportSuccess) => s.employee_id === selectedEmployee.employee_id)) {
        await fetchPromotions();
      }

      setUploadModalVisible(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.error || 'Failed to upload promotions');
    } finally {
      setUploading(false);
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
      render: (_: any, record: Promotion) => (
        <Space>
          <Button
            type="link"
            icon={React.createElement(EditOutlined)}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger
            icon={React.createElement(DeleteOutlined)}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    form.setFieldsValue({
      effective_date: dayjs(promotion.effective_date),
      to_designation_id: promotion.to_designation_id,
      level: promotion.level,
      remarks: promotion.remarks
    });
    setEditModalVisible(true);
  };

  const handleDelete = async (promotion: Promotion) => {
    Modal.confirm({
      title: 'Delete Promotion',
      icon: React.createElement(ExclamationCircleOutlined),
      content: (
        <div>
          <p>Are you sure you want to delete this promotion?</p>
          <p>Date: {dayjs(promotion.effective_date).format('DD/MM/YYYY')}</p>
          <p>From: {promotion.old_designation}</p>
          <p>To: {promotion.new_designation}</p>
        </div>
      ),
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await api.delete(`/hr/services/promotions/${promotion.id}`);
          message.success('Promotion deleted successfully');
          fetchPromotions();
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Failed to delete promotion');
        }
      }
    });
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingPromotion) return;
    
    try {
      setLoading(true);
      console.log('Form values being submitted:', values);
      
      // Ensure proper data types and format
      const updateData = {
        effective_date: dayjs(values.effective_date).format('YYYY-MM-DD'),
        to_designation_id: parseInt(values.to_designation_id, 10),
        level: parseInt(values.level, 10),
        remarks: values.remarks || null
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await api.put(`/hr/services/promotions/${editingPromotion.id}`, updateData);
      
      if (response.data.success) {
        message.success('Promotion updated successfully');
        setEditModalVisible(false);
        form.resetFields();
        fetchPromotions();
      } else {
        Modal.error({
          title: 'Error Updating Promotion',
          content: response.data.message || 'Failed to update promotion'
        });
      }
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('Detailed error:', error.response?.data);
      
      Modal.error({
        title: 'Error Updating Promotion',
        content: (
          <div>
            <p>{error.response?.data?.error || 'Failed to update promotion'}</p>
            {error.response?.data?.details && (
              <div style={{ marginTop: 10 }}>
                <p>Technical Details:</p>
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(error.response.data.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )
      });
    } finally {
      setLoading(false);
    }
  };

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

      {selectedEmployee && (
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
      )}

      {!selectedEmployee && (
        <div style={{ textAlign: 'center', padding: '32px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Please select an employee to view their promotion history</p>
        </div>
      )}

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add Promotion
        </Button>
        <Button onClick={() => setUploadModalVisible(true)}>
          Bulk Import
        </Button>
        <Button onClick={handleDownloadTemplate}>
          Download Template
        </Button>
      </div>

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

      <Modal
        title="Bulk Import Promotions"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <p>Please download the template first and fill in the promotion details according to the instructions.</p>
          <Button 
            onClick={handleDownloadTemplate}
            style={{ marginBottom: 16 }}
          >
            Download Template
          </Button>
          
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => {
              handleBulkUpload(file);
              return false;
            }}
          >
            <Button 
              loading={uploading}
              type="primary"
              style={{ width: '100%' }}
            >
              Upload Template
            </Button>
          </Upload>
          
          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <h4>Important Notes:</h4>
            <ul>
              <li>Use the provided template format</li>
              <li>Fill in all required fields marked with *</li>
              <li>Ensure Employee IDs are valid</li>
              <li>Dates should be in YYYY-MM-DD format</li>
              <li>Promotion dates must be after employee join dates</li>
            </ul>
          </div>
        </div>
      </Modal>

      <Modal
        title="Edit Promotion"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleEditSubmit}
          layout="vertical"
        >
          <Form.Item
            name="effective_date"
            label="Effective Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="to_designation_id"
            label="To Designation"
            rules={[{ required: true, message: 'Please select designation' }]}
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
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Promotion
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionHistory; 