import React, { useEffect, useState } from 'react';
import { 
  Button, Modal, Form, Input, DatePicker, Select, 
  message, Popconfirm, Space, Tag, Typography, Card, Tooltip,
  Row, Col, List
} from 'antd';
import { 
  EnvironmentOutlined, 
  CalendarOutlined, 
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import { Travel, TravelType } from '../../types/travel';
import { 
  getTravels, createTravel, updateTravel, deleteTravel 
} from '../../services/edoffice/travels';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const travelTypeColors: Record<TravelType, string> = {
  foreign: 'purple',
  domestic: 'blue'
};

// Add custom styles for the modal
const modalStyle = {
  zIndex: 1050,
};

// Add custom styles for the cards
const cardStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'row' as const,
};

const cardContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'row' as const,
  gap: '24px',
  padding: '16px',
};

const cardLeftSection = {
  flex: '0 0 200px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
  borderRight: '1px solid #f0f0f0',
  paddingRight: '24px',
};

const cardRightSection = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
};

const cardActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #f0f0f0',
};

const cardHeaderStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
};

const cardBodyStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
};

const cardSectionStyle = {
  marginBottom: '8px',
};

const cardTextStyle = {
  marginTop: '4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
};

const EdofcTravelsPage: React.FC = () => {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Only allow edofc users
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role?.toLowerCase() !== 'edofc') {
      message.error('Access denied');
      navigate('/');
    }
  }, [navigate]);

  const fetchTravels = async () => {
    try {
      setLoading(true);
      console.log('Fetching travels...');
      const data = await getTravels();
      console.log('Travels data:', data);
      setTravels(data);
    } catch (err: any) {
      console.error('Error fetching travels:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      message.error(err.response?.data?.error || 'Failed to load travels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravels();
  }, []);

  const openAddModal = () => {
    setEditingTravel(null);
    setModalVisible(true);
    // Reset form and set focus after a short delay
    setTimeout(() => {
      form.resetFields();
      const firstInput = document.querySelector('.travel-modal input');
      if (firstInput instanceof HTMLElement) {
        firstInput.focus();
      }
    }, 100);
  };

  const openEditModal = (travel: Travel) => {
    setEditingTravel(travel);
    setModalVisible(true);
    form.setFieldsValue({
      ...travel,
      dates: [dayjs(travel.onward_date), dayjs(travel.return_date)]
    });
    // Set focus after a short delay
    setTimeout(() => {
      const firstInput = document.querySelector('.travel-modal input');
      if (firstInput instanceof HTMLElement) {
        firstInput.focus();
      }
    }, 100);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTravel(id);
      message.success('Travel record deleted successfully');
      fetchTravels();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to delete travel record');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const { dates, ...rest } = values;
      
      const travelPayload = {
        ...rest,
        onward_date: dates[0].format('YYYY-MM-DD'),
        return_date: dates[1].format('YYYY-MM-DD')
      };
      
      if (editingTravel) {
        await updateTravel(editingTravel.id, travelPayload);
        message.success('Travel record updated successfully');
      } else {
        await createTravel(travelPayload);
        message.success('Travel record created successfully');
      }
      setModalVisible(false);
      fetchTravels();
    } catch (err: any) {
      if (err.errorFields) {
        // Form validation errors
        message.error('Please check the form for errors');
      } else {
        // API errors
        message.error(err.response?.data?.error || 'Failed to save travel record');
      }
    }
  };

  const handleCancel = () => {
    if (editingTravel) {
      // Only show confirmation when editing
      Modal.confirm({
        title: 'Discard Changes?',
        content: 'Are you sure you want to discard your changes?',
        okText: 'Yes, Discard',
        cancelText: 'No, Continue Editing',
        onOk: () => {
          setModalVisible(false);
          form.resetFields();
        }
      });
    } else {
      // No confirmation needed for adding new travel
      setModalVisible(false);
      form.resetFields();
    }
  };

  useEffect(() => {
    if (modalVisible) {
      // Force focus on the first input when modal opens
      setTimeout(() => {
        const firstInput = document.querySelector('.travel-modal input');
        if (firstInput instanceof HTMLElement) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [modalVisible]);

  // Sort travels by nearest date
  const sortedTravels = [...travels].sort((a, b) => {
    const dateA = dayjs(a.onward_date);
    const dateB = dayjs(b.onward_date);
    return dateA.diff(dateB);
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Travel List</Title>
        <Button 
          type="primary" 
          onClick={openAddModal}
        >
          Add Travel
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Tag color="purple">Foreign Travel</Tag>
          <Tag color="blue">Domestic Travel</Tag>
        </Space>
      </div>

      <List
        dataSource={sortedTravels}
        loading={loading}
        renderItem={travel => (
          <List.Item style={{ marginBottom: '16px' }}>
            <Card
              hoverable
              style={{
                ...cardStyle,
                backgroundColor: travel.travel_type === 'foreign' ? '#f9f0ff' : '#e6f7ff',
                borderLeft: `3px solid ${travelTypeColors[travel.travel_type]}`,
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div style={cardContentStyle}>
                <div style={cardLeftSection}>
                  <div style={cardHeaderStyle}>
                    <Title level={5} style={{ margin: 0 }}>{travel.location}</Title>
                    <Tag color={travelTypeColors[travel.travel_type]}>
                      {travel.travel_type.charAt(0).toUpperCase() + travel.travel_type.slice(1)}
                    </Tag>
                  </div>
                  <div style={cardSectionStyle}>
                    <strong>Dates:</strong>
                    <div style={cardTextStyle}>
                      <Space direction="vertical" size="small">
                        <div>📅 Onward: {dayjs(travel.onward_date).format('DD MMM YYYY')}</div>
                        <div>📅 Return: {dayjs(travel.return_date).format('DD MMM YYYY')}</div>
                      </Space>
                    </div>
                  </div>
                </div>

                <div style={cardRightSection}>
                  <div style={cardSectionStyle}>
                    <strong>Purpose:</strong>
                    <div style={cardTextStyle}>{travel.purpose}</div>
                  </div>

                  <div style={cardSectionStyle}>
                    <strong>Accommodation:</strong>
                    <div style={cardTextStyle}>{travel.accommodation}</div>
                  </div>

                  {travel.remarks && (
                    <div style={cardSectionStyle}>
                      <strong>Remarks:</strong>
                      <div style={cardTextStyle}>{travel.remarks}</div>
                    </div>
                  )}

                  <div style={cardActionsStyle}>
                    <Button 
                      type="text" 
                      onClick={() => openEditModal(travel)}
                      style={{ color: '#1890ff' }}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Are you sure you want to delete this travel?"
                      onConfirm={() => handleDelete(travel.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button 
                        type="text" 
                        danger
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingTravel ? "Edit Travel" : "Add Travel"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
        destroyOnClose
        centered
        maskClosable={false}
        keyboard={true}
        className="travel-modal"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingTravel || {
            travel_type: 'domestic',
            onward_date: dayjs(),
            return_date: dayjs().add(1, 'day')
          }}
        >
          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please enter the location' }]}
          >
            <Input 
              placeholder="Enter location"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="travel_type"
            label="Travel Type"
            rules={[{ required: true, message: 'Please select travel type' }]}
          >
            <Select>
              <Select.Option value="domestic">Domestic</Select.Option>
              <Select.Option value="foreign">Foreign</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dates"
            label="Travel Dates"
            rules={[
              { required: true, message: 'Please select travel dates' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value.length !== 2) {
                    return Promise.reject(new Error('Please select both onward and return dates'));
                  }
                  const [onward, return_] = value;
                  if (return_.isBefore(onward)) {
                    return Promise.reject(new Error('Return date must be after onward date'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker.RangePicker 
              style={{ width: '100%' }}
              format="DD MMM YYYY"
            />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true, message: 'Please enter the purpose' }]}
          >
            <TextArea 
              placeholder="Enter purpose of travel"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item
            name="accommodation"
            label="Accommodation"
            rules={[{ required: true, message: 'Please enter accommodation details' }]}
          >
            <TextArea 
              placeholder="Enter accommodation details"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <TextArea 
              placeholder="Enter any additional remarks"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EdofcTravelsPage; 