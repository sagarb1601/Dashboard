import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Button, Card, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import moment from 'moment';

interface Contractor {
  contractor_id: number;
  contractor_company_name: string;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface MappingFormData {
  contractor_id: number;
  department_id: number;
  start_date: Dayjs;
  end_date: Dayjs;
}

const ContractorMapping: React.FC = () => {
  const [form] = Form.useForm();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractorsRes, departmentsRes] = await Promise.all([
          axios.get('/api/admin/contractors'),
          axios.get('/api/admin/departments')
        ]);
        setContractors(contractorsRes.data);
        setDepartments(departmentsRes.data);
      } catch (error) {
        message.error('Failed to load data');
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const onFinish = async (values: MappingFormData) => {
    setLoading(true);
    try {
      await axios.post('/api/admin/contractor-mappings', {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
      });
      message.success('Contract mapping added successfully');
      form.resetFields();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add contract mapping';
      message.error(errorMessage);
      console.error('Error adding mapping:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEndDate = (_: any, value: Dayjs) => {
    const startDate = form.getFieldValue('start_date');
    if (startDate && value && value.isBefore(startDate)) {
      return Promise.reject('End date must be after start date');
    }
    return Promise.resolve();
  };

  const formatDate = (date: Dayjs | null) => {
    return date ? date.format('YYYY-MM-DD') : '';
  };

  return (
    <Card title="Map Contractor to Department">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Select Contractor"
          name="contractor_id"
          rules={[{ required: true, message: 'Please select a contractor' }]}
        >
          <Select
            placeholder="Select a contractor"
            showSearch
            optionFilterProp="label"
            options={contractors.map(c => ({
              value: c.contractor_id,
              label: c.contractor_company_name,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Select Department"
          name="department_id"
          rules={[{ required: true, message: 'Please select a department' }]}
        >
          <Select
            placeholder="Select a department"
            showSearch
            optionFilterProp="label"
            options={departments.map(d => ({
              value: d.department_id,
              label: d.department_name,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Contract Start Date"
          name="start_date"
          rules={[
            { required: true, message: 'Please select start date' },
            { type: 'date', message: 'Please select a valid date' }
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={date => date ? date.isBefore(dayjs().startOf('day').toDate()) : false}
          />
        </Form.Item>

        <Form.Item
          label="Contract End Date"
          name="end_date"
          rules={[
            { required: true, message: 'Please select end date' },
            { type: 'date', message: 'Please select a valid date' },
            { validator: validateEndDate }
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={date => {
              if (!date || !date.isValid()) return false;
              const today = moment().startOf('day');
              const startDate = form.getFieldValue('start_date');
              return moment(date).isSameOrBefore(today) || 
                     (startDate && moment(date).isSameOrBefore(moment(startDate)));
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Add Mapping
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ContractorMapping; 