import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, message, Card, Table, Space, Modal } from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { IconWrapper } from '../../../utils/IconWrapper';
import { contractors, mappings } from '../../../utils/api';
import { Contractor, contractorSchema, ContractorMapping } from '../../../types/contractor';
import type { TableProps } from 'antd/es/table';

const WrappedEditIcon = IconWrapper(EditOutlined);
const WrappedPlusIcon = IconWrapper(PlusOutlined);
const WrappedDeleteIcon = IconWrapper(DeleteOutlined);

const ContractorsTab: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [contractorsList, setContractorsList] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [contractorMappings, setContractorMappings] = useState<{ [key: number]: boolean }>({});

  const checkContractorMappings = useCallback((mappings: ContractorMapping[]) => {
    const mappingMap: { [key: number]: boolean } = {};
    mappings.forEach(mapping => {
      mappingMap[mapping.contractor_id] = true;
    });
    setContractorMappings(mappingMap);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractorsRes, mappingsRes] = await Promise.all([
        contractors.getAll(),
        mappings.getAll()
      ]);
      setContractorsList(contractorsRes.data);
      checkContractorMappings(mappingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showModal = (contractor?: Contractor) => {
    form.resetFields();
    if (contractor) {
      setEditingContractor(contractor);
      form.setFieldsValue(contractor);
    } else {
      setEditingContractor(null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingContractor(null);
  };

  const onFinish = async (values: any) => {
    try {
      // Validate the data against our schema
      await contractorSchema.validate(values, { abortEarly: false });

      setSubmitting(true);
      if (editingContractor) {
        await contractors.update(editingContractor.contractor_id, values);
        message.success('Contractor updated successfully');
      } else {
        await contractors.create(values);
        message.success('Contractor added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingContractor(null);
      fetchData(); // Refresh the table
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        // Show all validation errors
        const errorMessages = error.errors.map((err: string) => (
          <div key={err}>{err}</div>
        ));
        Modal.error({
          title: 'Validation Error',
          content: <div>{errorMessages}</div>,
          width: 400,
        });
      } else if (error.response?.data?.errors) {
        // Handle backend validation errors
        const errorMessages = error.response.data.errors.map((err: any) => (
          <div key={err.msg}>{err.msg}</div>
        ));
        Modal.error({
          title: 'Validation Error',
          content: <div>{errorMessages}</div>,
          width: 400,
        });
      } else {
        Modal.error({
          title: 'Error',
          content: error.response?.data?.message || (editingContractor ? 'Failed to update contractor' : 'Failed to add contractor'),
          width: 400,
        });
        console.error('Error:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contractorId: number) => {
    if (contractorMappings[contractorId]) {
      Modal.warning({
        title: 'Cannot Delete Contractor',
        content: 'This contractor has existing mappings (active or inactive). Please delete all mappings before deleting the contractor.'
      });
      return;
    }

    Modal.confirm({
      title: 'Delete Contractor',
      content: 'Are you sure you want to delete this contractor? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Cancel',
      onOk: async () => {
        try {
          await contractors.delete(contractorId);
          message.success('Contractor deleted successfully');
          fetchData();
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to delete contractor';
          Modal.error({
            title: 'Error',
            content: errorMessage
          });
          console.error('Error deleting contractor:', error);
        }
      }
    });
  };

  const columns: TableProps<Contractor>['columns'] = [
    {
      title: 'Company Name',
      dataIndex: 'contractor_company_name',
      key: 'contractor_company_name',
      width: '25%',
      ellipsis: true,
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: '20%',
      ellipsis: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: '15%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '20%',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: 'nowrap' }}>
          <Button
            type="link"
            onClick={() => showModal(record)}
            icon={<WrappedEditIcon />}
            style={{ padding: '4px 8px' }}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record.contractor_id)}
            disabled={contractorMappings[record.contractor_id]}
            icon={<WrappedDeleteIcon />}
            style={{ padding: '4px 8px' }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Contractors Management</h2>
        <Button
          type="primary"
          onClick={() => showModal(undefined)}
          icon={<WrappedPlusIcon />}
        >
          Add Contractor
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={contractorsList}
        rowKey="contractor_id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} contractors`
        }}
      />

      <Modal
        title={editingContractor ? "Edit Contractor" : "Add New Contractor"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="contractor_company_name"
            label="Company Name"
            rules={[
              { required: true, message: 'Please enter company name' },
              { min: 2, message: 'Company name must be at least 2 characters' },
              { max: 100, message: 'Company name must not exceed 100 characters' }
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input
              placeholder="Enter company name"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="contact_person"
            label="Contact Person"
            rules={[
              { required: true, message: 'Please enter contact person' },
              { min: 2, message: 'Contact person name must be at least 2 characters' },
              { max: 100, message: 'Contact person name must not exceed 100 characters' }
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input
              placeholder="Enter contact person name"
              maxLength={100}
            />
          </Form.Item>

           {/* <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please enter phone number" },
              {
                pattern:
                  /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
                message: "Please enter a valid phone number",
              },
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input 
              placeholder="Enter phone number" 
              maxLength={15}
            />
          </Form.Item> */}

            <Form.Item
                      label="Phone"
                      name="phone"
                      rules={[
                        { required: true, message: 'Please enter phone number' },
                        { pattern: /^\d{10}$/, message: 'Phone number must be exactly 10 digits' }
                      ]}
                    >
                      <Input placeholder="Enter 10-digit phone number" maxLength={10} />
                    </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Please enter a valid email address' },
              {
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Please enter a valid email address'
              }
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input
              type="email"
              placeholder="Enter email address"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
              >
                {editingContractor ? 'Update Contractor' : 'Add Contractor'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ContractorsTab; 