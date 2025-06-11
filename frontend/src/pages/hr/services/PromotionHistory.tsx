import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Modal, Form, DatePicker, Input, Select, message, Space, InputNumber, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../utils/api';

// Remove the custom icon components and use icons directly with required props
const iconProps = {
  style: { fontSize: '16px' },
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
};

interface Employee {
  employee_id: number;
  employee_name: string;
}

interface Promotion {
  id: number;
  employee_id: number;
  employee_name: string;
  old_designation: string;
  new_designation: string;
  effective_date: string;
  level: number;
  remarks: string | null;
  to_designation_id: number;
  from_designation_id: number;
}

interface Designation {
  designation_id: number;
  designation: string;
  designation_full?: string;
}

const PromotionHistory: React.FC = () => {
    const [promotionsList, setPromotionsList] = useState<Promotion[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [bulkAddModalVisible, setBulkAddModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [form] = Form.useForm();
    const [bulkForm] = Form.useForm();
    const [promotionForms, setPromotionForms] = useState<{ key: number }[]>([{ key: 0 }]);

  useEffect(() => {
        fetchData();
  }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [promotionsRes, employeesRes, designationsRes] = await Promise.all([
                api.get('/hr/services/promotions'),
                api.get('/hr/employees'),
                api.get('/hr/designations')
            ]);
            
            console.log('API Responses:', {
                promotions: promotionsRes.data,
                employees: employeesRes.data,
                designations: designationsRes.data
            });

            setPromotionsList(promotionsRes.data || []);
            setEmployees(employeesRes.data || []);
            setDesignations(designationsRes.data || []);
    } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/hr/services/promotions/${id}`);
            message.success('Promotion deleted successfully');
            fetchData();
        } catch (error) {
            message.error('Error deleting promotion');
            console.error('Error:', error);
        }
    };

    const handleEdit = (record: Promotion) => {
        setEditingPromotion(record);
        form.setFieldsValue({
            effective_date: dayjs(record.effective_date),
            level: record.level,
            remarks: record.remarks
        });
        setEditModalVisible(true);
    };

    const handleEditSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (!editingPromotion) return;

            const updateData = {
                employee_id: editingPromotion.employee_id,
                from_designation_id: editingPromotion.from_designation_id,
                to_designation_id: editingPromotion.to_designation_id,
                effective_date: dayjs(values.effective_date).format('YYYY-MM-DD'),
                level: values.level,
                remarks: values.remarks || null
            };

            await api.put(`/hr/services/promotions/${editingPromotion.id}`, updateData);
            message.success('Promotion updated successfully');
            setEditModalVisible(false);
      form.resetFields();
            setEditingPromotion(null);
            fetchData();
        } catch (error) {
            message.error('Error updating promotion');
            console.error('Error:', error);
        }
    };

    const handleAdd = () => {
        form.resetFields();
        if (selectedEmployee) {
            const employee = employees.find(emp => emp.employee_id === selectedEmployee);
            if (employee) {
                form.setFieldsValue({
                    employee_id: selectedEmployee
                });
            }
        }
        setAddModalVisible(true);
    };

    const handleBulkAdd = () => {
        bulkForm.resetFields();
        if (selectedEmployee) {
            bulkForm.setFieldsValue({
                employee_id: selectedEmployee
            });
        }
        setBulkAddModalVisible(true);
        setPromotionForms([{ key: 0 }]);
    };

    const handleAddSubmit = async () => {
        try {
            const values = await form.validateFields();
            const employee = employees.find(emp => emp.employee_id === values.employee_id);
            
            if (!employee) {
                Modal.error({
                    title: 'Error',
                    content: 'Employee not found'
                });
                return;
            }

            const promotionData = {
                employee_id: values.employee_id,
                employee_name: employee.employee_name,
                effective_date: values.effective_date.format('YYYY-MM-DD'),
                from_designation_id: values.from_designation_id,
                to_designation_id: values.to_designation_id,
                level: values.level,
                remarks: values.remarks || null
            };

            await api.post('/hr/services/promotions', promotionData);
            message.success('Promotion added successfully');
            setAddModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error: any) {
            console.error('Error:', error);
            let errorMessage = 'An error occurred while adding the promotion';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Modal.error({
                title: 'Error Adding Promotion',
                content: errorMessage,
                maskClosable: true
            });
        }
    };

    const handleBulkAddSubmit = async () => {
        try {
            const values = await bulkForm.validateFields();
            const employee = employees.find(emp => emp.employee_id === values.employee_id);
            
            if (!employee) {
                Modal.error({
                    title: 'Error',
                    content: 'Employee not found'
                });
                return;
            }

            const promotionsToAdd = promotionForms.map(({ key }) => {
                const fromDesignation = designations.find(d => d.designation_id === values[`from_designation_${key}`]);
                const toDesignation = designations.find(d => d.designation_id === values[`to_designation_${key}`]);

                return {
                    employee_id: values.employee_id,
                    employee_name: employee.employee_name,
                    effective_date: values[`effective_date_${key}`].format('YYYY-MM-DD'),
                    from_designation_id: values[`from_designation_${key}`],
                    to_designation_id: values[`to_designation_${key}`],
                    old_designation: fromDesignation?.designation || '',
                    new_designation: toDesignation?.designation || '',
                    level: values[`level_${key}`],
                    remarks: values[`remarks_${key}`] || null
                };
            });

            for (const promotionData of promotionsToAdd) {
                await api.post('/hr/services/promotions', promotionData);
            }

            message.success('Promotions added successfully');
            setBulkAddModalVisible(false);
            bulkForm.resetFields();
            fetchData();
        } catch (error: any) {
            console.error('Error:', error);
            let errorMessage = 'An error occurred while adding promotions';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

        Modal.error({
                title: 'Error Adding Promotions',
                content: errorMessage,
                maskClosable: true
            });
        }
    };

    const addPromotionForm = () => {
        const newKey = promotionForms.length;
        setPromotionForms([...promotionForms, { key: newKey }]);
    };

    const removePromotionForm = (key: number) => {
        if (promotionForms.length > 1) {
            setPromotionForms(promotionForms.filter(form => form.key !== key));
            bulkForm.setFieldsValue({
                [`effective_date_${key}`]: undefined,
                [`from_designation_${key}`]: undefined,
                [`to_designation_${key}`]: undefined,
                [`level_${key}`]: undefined,
                [`remarks_${key}`]: undefined
            });
        }
    };

    const handleEmployeeSelect = (value: number | null) => {
        console.log('Selected employee:', value);
        console.log('Current promotions list:', promotionsList);
        setSelectedEmployee(value);
    };

    useEffect(() => {
        console.log('Selected employee changed:', selectedEmployee);
        console.log('Current promotions list:', promotionsList);
    }, [selectedEmployee, promotionsList]);

    const filteredPromotions = useMemo(() => {
        if (!selectedEmployee) return promotionsList;
        
        const filtered = promotionsList.filter(p => p.employee_id === selectedEmployee);
        console.log('Filtered promotions for employee', selectedEmployee, ':', filtered);
        return filtered;
    }, [selectedEmployee, promotionsList]);

  const columns = [
    {
            title: 'Employee ID',
            dataIndex: 'employee_id',
            key: 'employee_id',
            sorter: (a: Promotion, b: Promotion) => a.employee_id - b.employee_id
        },
        {
            title: 'Employee Name',
            dataIndex: 'employee_name',
            key: 'employee_name',
            sorter: (a: Promotion, b: Promotion) => a.employee_name.localeCompare(b.employee_name)
    },
    {
      title: 'From Designation',
      dataIndex: 'old_designation',
            key: 'old_designation'
    },
    {
      title: 'To Designation',
      dataIndex: 'new_designation',
            key: 'new_designation'
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
            sorter: (a: Promotion, b: Promotion) => a.level - b.level
        },
        {
            title: 'Effective Date',
            dataIndex: 'effective_date',
            key: 'effective_date',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            sorter: (a: Promotion, b: Promotion) => dayjs(a.effective_date).unix() - dayjs(b.effective_date).unix()
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
            key: 'remarks'
    },
    {
      title: 'Actions',
      key: 'actions',
            render: (_: unknown, record: Promotion) => (
                <Space size="small">
                    <Button 
                        type="link" 
                        icon={<EditOutlined {...iconProps} />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this promotion?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<DeleteOutlined {...iconProps} />} />
                    </Popconfirm>
                </Space>
            )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
          <Select
                        style={{ width: 300 }}
                        placeholder="Filter by Employee"
                        allowClear
                        value={selectedEmployee}
                        onChange={handleEmployeeSelect}
            options={employees.map(emp => ({
              value: emp.employee_id,
              label: `${emp.employee_id} - ${emp.employee_name}`
            }))}
                    />
                </Space>
                <Space>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined {...iconProps} />}
                        onClick={handleAdd}
                        disabled={!selectedEmployee}
                    >
                        Add Promotion
                    </Button>
          <Button 
            type="primary"
                        icon={<PlusOutlined {...iconProps} />}
                        onClick={handleBulkAdd}
            disabled={!selectedEmployee}
          >
                        Bulk Add Promotions
          </Button>
                </Space>
      </div>

            {selectedEmployee ? (
          <Table
                    dataSource={filteredPromotions}
            columns={columns}
            rowKey="id"
            loading={loading}
                    pagination={{ 
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total: number, range: [number, number]) => 
                          `${range[0]}-${range[1]} of ${total} items`
                    }}
                />
            ) : (
        <div style={{ textAlign: 'center', padding: '32px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Please select an employee to view their promotion history</p>
        </div>
      )}

            {/* Edit Modal */}
            <Modal
                title="Edit Promotion"
                open={editModalVisible}
                onOk={handleEditSubmit}
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingPromotion(null);
                    form.resetFields();
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="effective_date"
                        label="Effective Date"
                        rules={[{ required: true, message: 'Please select effective date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="level"
                        label="Level"
                        rules={[{ required: true, message: 'Please enter level' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>
                    <Form.Item
                        name="remarks"
                        label="Remarks"
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Bulk Add Promotions Modal */}
      <Modal
        title="Add Multiple Promotions"
                open={bulkAddModalVisible}
                onOk={handleBulkAddSubmit}
        onCancel={() => {
                    setBulkAddModalVisible(false);
                    bulkForm.resetFields();
                    setPromotionForms([{ key: 0 }]);
                }}
        width={800}
      >
                <Form form={bulkForm} layout="vertical">
                    <Form.Item
                        name="employee_id"
                        label="Employee"
                        rules={[{ required: true, message: 'Please select an employee' }]}
                        initialValue={selectedEmployee}
                    >
                        <Select
                            showSearch
                            placeholder="Select an employee"
                            optionFilterProp="children"
                            disabled={true}
                        >
                            {employees.map(emp => (
                                <Select.Option key={emp.employee_id} value={emp.employee_id}>
                                    {`${emp.employee_id} - ${emp.employee_name}`}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {promotionForms.map(({ key }) => (
                        <div key={key} style={{ 
              border: '1px solid #f0f0f0', 
              padding: '16px', 
              marginBottom: '16px',
                            borderRadius: '4px',
              position: 'relative'
            }}>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4>Promotion {key + 1}</h4>
                                {promotionForms.length > 1 && (
                                    <Button type="link" danger onClick={() => removePromotionForm(key)}>
                    Remove
                  </Button>
                )}
              </div>

              <Form.Item
                                name={`effective_date_${key}`}
                label="Effective Date"
                rules={[{ required: true, message: 'Please select effective date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                                name={`from_designation_${key}`}
                                label="From Designation"
                                rules={[{ required: true, message: 'Please select from designation' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select from designation"
                                    optionFilterProp="children"
                                >
                                    {designations.map(des => (
                                        <Select.Option key={des.designation_id} value={des.designation_id}>
                                            {des.designation}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name={`to_designation_${key}`}
                label="To Designation"
                rules={[{ required: true, message: 'Please select to designation' }]}
              >
                                <Select
                                    showSearch
                                    placeholder="Select to designation"
                                    optionFilterProp="children"
                                >
                                    {designations.map(des => (
                                        <Select.Option key={des.designation_id} value={des.designation_id}>
                                            {des.designation}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                                name={`level_${key}`}
                label="Level"
                rules={[{ required: true, message: 'Please enter level' }]}
              >
                                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>

              <Form.Item
                                name={`remarks_${key}`}
                label="Remarks"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </div>
          ))}

            <Button type="dashed" onClick={addPromotionForm} block>
              + Add Another Promotion
            </Button>
        </Form>
      </Modal>

            {/* Add Single Promotion Modal */}
      <Modal
                title="Add Promotion"
                open={addModalVisible}
                onOk={handleAddSubmit}
                onCancel={() => {
                    setAddModalVisible(false);
                    form.resetFields();
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="employee_id"
                        label="Employee"
                        rules={[{ required: true, message: 'Please select an employee' }]}
                        initialValue={selectedEmployee}
                    >
                        <Select
                            showSearch
                            placeholder="Select an employee"
                            optionFilterProp="children"
                            disabled={true}
                        >
                            {employees.map(emp => (
                                <Select.Option key={emp.employee_id} value={emp.employee_id}>
                                    {`${emp.employee_id} - ${emp.employee_name}`}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

          <Form.Item
            name="effective_date"
            label="Effective Date"
                        rules={[{ required: true, message: 'Please select effective date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="from_designation_id"
                        label="From Designation"
                        rules={[{ required: true, message: 'Please select from designation' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Select from designation"
                            optionFilterProp="children"
                        >
                            {designations.map(des => (
                                <Select.Option key={des.designation_id} value={des.designation_id}>
                                    {des.designation}
                                </Select.Option>
                            ))}
                        </Select>
          </Form.Item>

          <Form.Item
            name="to_designation_id"
            label="To Designation"
                        rules={[{ required: true, message: 'Please select to designation' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Select to designation"
                            optionFilterProp="children"
                        >
                            {designations.map(des => (
                                <Select.Option key={des.designation_id} value={des.designation_id}>
                                    {des.designation}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Please enter level' }]}
          >
                        <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
                        <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionHistory; 