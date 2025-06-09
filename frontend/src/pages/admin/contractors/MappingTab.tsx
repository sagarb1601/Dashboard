import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Table, Tag, message, Card, Space, Alert, Modal, Tabs, List, Typography, Input } from 'antd';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { PlusOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import type { Rule } from 'antd/es/form';
import type { DatePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import { contractors, departments, mappings } from '../../../utils/api';
import { Contractor, Department, ContractorMapping, mappingSchema } from '../../../types/contractor';
import type { SelectProps } from 'antd/es/select';
import { useNavigate } from 'react-router-dom';
import { IconWrapper } from '../../../utils/IconWrapper';
import moment from 'moment';
import { useMappingContext } from '../../../contexts/MappingContext';
import ActionButtons from '../../../components/common/ActionButtons';
import FormModal from '../../../components/common/FormModal';
import type { ColumnsType } from 'antd/es/table';

// Configure dayjs plugins
dayjs.extend(weekday);
dayjs.extend(localeData);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Add type for form validator
type ValidatorRule = Rule & {
  validator: (_: any, value: Dayjs) => Promise<void>;
};

// Add type for disabled date function
type DisabledDateFn = (current: Dayjs) => boolean;

// Add type for filter option
type FilterOptionType = (input: string, option: { label: string }) => boolean;

interface SelectOption {
  label: string;
  value: number;
}

interface FormData {
  contractor_id: number;
  department_id: number;
  start_date: Dayjs;
  end_date: Dayjs;
}

interface ContractorMappingCreate {
  contractor_id: number;
  department_id: number;
  start_date: string;
  end_date: string;
}

interface Option {
  value: number;
  label: string;
}

const WrappedUserOutlined = IconWrapper(UserOutlined);
const WrappedTeamOutlined = IconWrapper(TeamOutlined);
const WrappedPlusOutlined = IconWrapper(PlusOutlined);

const MappingTab: React.FC = () => {
  const [form] = Form.useForm();
  const [contractorsList, setContractorsList] = useState<Contractor[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [mappingsList, setMappingsList] = useState<ContractorMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ContractorMapping | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const navigate = useNavigate();
  const { refreshMappings } = useMappingContext();
  const [error, setError] = useState<string | null>(null);

  const dateFormat = 'YYYY-MM-DD';

  const disabledDate = (current: any) => {
    // Allow all dates
    return false;
  };

  const disabledEndDate = (current: any) => {
    const startDate = form.getFieldValue('start_date');
    return startDate && current && current < startDate;
  };

  // Fetch initial data
  const fetchData = async () => {
    console.log('fetchData called');
    setLoading(true);
    try {
      console.log('Making API calls...');
      const [contractorsRes, departmentsRes, mappingsRes] = await Promise.all([
        contractors.getAll(),
        departments.getAll(),
        mappings.getAll()
      ]);

      console.log('API responses:', {
        contractors: contractorsRes.data,
        departments: departmentsRes.data,
        mappings: mappingsRes.data
      });

      // Check if the responses are valid
      if (!Array.isArray(contractorsRes.data)) {
        throw new Error('Invalid contractors data received');
      }

      if (!Array.isArray(departmentsRes.data)) {
        throw new Error('Invalid departments data received');
      }

      if (!Array.isArray(mappingsRes.data)) {
        throw new Error('Invalid mappings data received');
      }

      setContractorsList(contractorsRes.data);
      setDepartmentsList(departmentsRes.data);
      setMappingsList(mappingsRes.data);

      console.log('State updated with:', {
        contractors: contractorsRes.data,
        departments: departmentsRes.data,
        mappings: mappingsRes.data
      });

    } catch (error) {
      console.error('Error loading data:', error);
      message.error(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('MappingTab component mounted');
    fetchData();
  }, []);

  const showModal = (department: Department | null) => {
    console.log('Add Mapping button clicked');
    console.log('Current state:', {
      contractorsList,
      departmentsList,
      mappingsList,
      isModalVisible
    });
    
    if (!contractorsList || contractorsList.length === 0) {
      console.log('No contractors available');
      message.warning('Please add contractors first before creating mappings');
      return;
    }
    if (!departmentsList || departmentsList.length === 0) {
      console.log('No departments available');
      message.warning('No departments available. Please contact your administrator.');
      return;
    }
    console.log('Opening modal');
    form.resetFields();
    setSelectedDepartment(department);
    if (department) {
      form.setFieldValue('department_id', department.department_id);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingMapping(null);
    setSelectedDepartment(null);
  };

  const handleDelete = async (record: ContractorMapping) => {
    if (!isContractActive(record)) {
      message.error('Cannot delete inactive contract mappings');
      return;
    }

    try {
      await mappings.delete(record.contract_id);
      message.success('Mapping deleted successfully');
      await fetchData();
      refreshMappings();
    } catch (error) {
      message.error('Failed to delete mapping');
      console.error('Error deleting mapping:', error);
    }
  };

  const handleEdit = (record: ContractorMapping) => {
    setEditingMapping(record);
    form.setFieldsValue({
      contractor_id: record.contractor_id,
      department_id: record.department_id,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
    });
    setIsModalVisible(true);
  };

  const validateMapping = (values: any): string | null => {
    console.log('Validating mapping with values:', values);
    console.log('Current mappings:', mappingsList);

    if (!values.contractor_id || !values.department_id) {
      return null;
    }

    // Check if mapping already exists
    const existingMapping = mappingsList.find(mapping => {
      const isDuplicate = 
        Number(mapping.contractor_id) === Number(values.contractor_id) && 
        Number(mapping.department_id) === Number(values.department_id) &&
        mapping.status !== 'INACTIVE' &&
        // Exclude the current mapping being edited
        (!editingMapping || mapping.contract_id !== editingMapping.contract_id);
      
      if (isDuplicate) {
        console.log('Found duplicate mapping:', mapping);
      }

      return isDuplicate;
    });

    if (existingMapping) {
      return `This contractor is already mapped to this department (Status: ${existingMapping.status})`;
    }

    return null;
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      const formattedData: ContractorMappingCreate = {
        contractor_id: values.contractor_id,
        department_id: values.department_id,
        start_date: values.contract_period[0].format('YYYY-MM-DD'),
        end_date: values.contract_period[1].format('YYYY-MM-DD'),
      };

      if (editingMapping) {
        await mappings.update(editingMapping.contract_id, formattedData);
        message.success('Mapping updated successfully');
      } else {
        await mappings.create(formattedData);
        message.success('Mapping created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingMapping(null);
      await fetchData();
      refreshMappings();
    } catch (error) {
      console.error('Error saving mapping:', error);
      message.error('Failed to save mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'INACTIVE':
        return 'red';
      case 'UPCOMING':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getDepartmentMappings = (departmentId: number) => {
    return mappingsList.filter(m => m.department_id === departmentId);
  };

  const getContractorName = (contractorId: number) => {
    const contractor = contractorsList.find(c => c.contractor_id === contractorId);
    return contractor ? contractor.contractor_company_name : 'Unknown';
  };

  const isContractActive = (record: ContractorMapping) => {
    const today = dayjs();
    const endDate = dayjs(record.end_date);
    return endDate.isAfter(today);
  };

  const columns: ColumnsType<ContractorMapping> = [
    {
      title: 'Contractor',
      dataIndex: 'contractor_company_name',
      key: 'contractor_company_name',
      sorter: (a, b) => a.contractor_company_name.localeCompare(b.contractor_company_name),
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      sorter: (a, b) => a.department_name.localeCompare(b.department_name),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record: ContractorMapping) => (
        <Tag color={isContractActive(record) ? 'success' : 'error'}>
          {isContractActive(record) ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ContractorMapping) => (
        <ActionButtons
          onEdit={() => {
            setEditingMapping(record);
            form.setFieldsValue({
              contractor_id: record.contractor_id,
              department_id: record.department_id,
              contract_period: [
                dayjs(record.start_date),
                dayjs(record.end_date)
              ]
            });
            setError(null);
            setIsModalVisible(true);
          }}
          onDelete={() => handleDelete(record)}
          deleteDisabled={!isContractActive(record)}
          deleteTooltip="Only active contract mappings can be deleted"
          recordName={`${record.contractor_company_name} - ${record.department_name}`}
        />
      ),
    },
  ];

  return (
    <Card style={{ textAlign: 'left' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Department-Contractor Mapping</Title>
          <Button
            type="primary"
            icon={<WrappedPlusOutlined />}
            onClick={() => {
              setEditingMapping(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add Mapping
          </Button>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={mappingsList}
          rowKey="contract_id"
        />
      </Space>

      <FormModal
        title={editingMapping ? 'Edit Contract Mapping' : 'Add Contract Mapping'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingMapping(null);
          form.resetFields();
          setError(null);
        }}
        form={form}
        onFinish={onFinish}
        loading={submitting}
        error={error}
      >
        <Form.Item
          name="contractor_id"
          label="Select Contractor"
          rules={[
            { required: true, message: 'Please select a contractor' },
            {
              validator: async (_, value) => {
                if (!value) return Promise.resolve();
                const department_id = form.getFieldValue('department_id');
                if (!department_id) return Promise.resolve();
                
                const validationError = validateMapping({ department_id, contractor_id: value });
                if (validationError) {
                  return Promise.reject(validationError);
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Select
            showSearch
            placeholder="Select a contractor"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={contractorsList.map(c => ({
              value: c.contractor_id,
              label: c.contractor_company_name
            }))}
            disabled={!!editingMapping}
          />
        </Form.Item>

        <Form.Item
          name="department_id"
          label="Select Department"
          rules={[
            { required: true, message: 'Please select a department' },
            {
              validator: async (_, value) => {
                if (!value) return Promise.resolve();
                const contractor_id = form.getFieldValue('contractor_id');
                if (!contractor_id) return Promise.resolve();
                
                const validationError = validateMapping({ department_id: value, contractor_id });
                if (validationError) {
                  return Promise.reject(validationError);
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Select
            showSearch
            placeholder="Select a department"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={departmentsList.map(d => ({
              value: d.department_id,
              label: d.department_name
            }))}
            disabled={!!editingMapping}
          />
        </Form.Item>

        <Form.Item
          name="contract_period"
          label="Contract Period"
          rules={[
            { required: true, message: 'Please select contract period' },
            {
              validator: async (_, value) => {
                if (value && value[0] && value[1]) {
                  const start = dayjs(value[0]);
                  const end = dayjs(value[1]);
                  if (start.isSame(end) || start.isAfter(end)) {
                    throw new Error('End date must be after start date');
                  }
                }
              }
            }
          ]}
        >
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </FormModal>
    </Card>
  );
};

export default MappingTab; 