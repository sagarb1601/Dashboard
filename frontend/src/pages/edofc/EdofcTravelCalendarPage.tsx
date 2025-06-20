import React, { useEffect, useState } from 'react';
import { 
  Calendar, Button, Modal, Form, Input, DatePicker, Select, 
  message, Popconfirm, Space, Tag, Typography, Card, Tooltip, Drawer 
} from 'antd';
import { Travel, TravelType } from '../../types/travel';
import { 
  getTravels, createTravel, updateTravel, deleteTravel 
} from '../../services/edoffice/travels';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { CalendarProps } from 'antd';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title } = Typography;
const { TextArea } = Input;

// Custom Calendar component that uses dayjs
const DayjsCalendar = Calendar as unknown as React.FC<CalendarProps<Dayjs>>;

const travelTypeColors: Record<TravelType, string> = {
  foreign: 'purple',
  domestic: 'blue'
};

const EdofcTravelCalendarPage: React.FC = () => {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDateTravels, setSelectedDateTravels] = useState<Travel[]>([]);

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
      const data = await getTravels();
      setTravels(data);
    } catch (err) {
      message.error('Failed to load travels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravels();
  }, []);

  const openAddModal = () => {
    setEditingTravel(null);
    form.resetFields();
    form.setFieldsValue({
      travel_type: 'domestic',
      onward_date: selectedDate,
      return_date: selectedDate.add(1, 'day')
    });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const travelPayload = {
        ...values,
        onward_date: values.onward_date.format('YYYY-MM-DD'),
        return_date: values.return_date.format('YYYY-MM-DD')
      };
      
      if (editingTravel) {
        await updateTravel(editingTravel.id, travelPayload);
        message.success('Travel updated');
      } else {
        await createTravel(travelPayload);
        message.success('Travel created');
      }
      setModalVisible(false);
      fetchTravels();
    } catch (err) {
      // Validation error or API error
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleDateClick = (date: Dayjs) => {
    const travelsForDate = travels.filter(travel =>
      date.isBetween(dayjs(travel.onward_date), dayjs(travel.return_date), 'day', '[]')
    );
    setSelectedDateTravels(travelsForDate);
    setDrawerVisible(true);
  };

  const dateCellRender = (date: Dayjs) => {
    const travelsForDate = travels.filter(travel =>
      date.isBetween(dayjs(travel.onward_date), dayjs(travel.return_date), 'day', '[]')
    );

    return (
      <div onClick={() => handleDateClick(date)}>
        {travelsForDate.map(travel => (
          <Tooltip
            key={travel.id}
            title={
              <div>
                <div><strong>{travel.location}</strong></div>
                <div>{travel.purpose}</div>
                <div>Accommodation: {travel.accommodation}</div>
                {travel.remarks && <div>Remarks: {travel.remarks}</div>}
              </div>
            }
            placement="right"
          >
            <div style={{ cursor: 'pointer', marginBottom: 2 }}>
              <Tag color={travelTypeColors[travel.travel_type]} style={{ width: '100%', margin: 0 }}>
                {travel.location}
              </Tag>
            </div>
          </Tooltip>
        ))}
      </div>
    );
  };

  const renderCalendarHeader = ({ value, onChange }: { value: Dayjs, onChange: (date: Dayjs) => void }) => {
    const start = 0;
    const end = 12;
    const monthOptions = [];

    for (let i = start; i < end; i++) {
      monthOptions.push(
        <Select.Option key={i} value={i}>
          {dayjs().month(i).format('MMMM')}
        </Select.Option>
      );
    }

    const year = value.year();
    const month = value.month();
    const options = [];
    for (let i = year - 10; i < year + 10; i += 1) {
      options.push(
        <Select.Option key={i} value={i}>
          {i}
        </Select.Option>
      );
    }

    return (
      <div style={{ 
        padding: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tag color="purple">Foreign Travel</Tag>
          <Tag color="blue">Domestic Travel</Tag>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Select
            value={month}
            onChange={(newMonth) => {
              const now = value.clone().month(newMonth);
              onChange(now);
            }}
            style={{ width: 120 }}
          >
            {monthOptions}
          </Select>
          <Select
            value={year}
            onChange={(newYear) => {
              const now = value.clone().year(newYear);
              onChange(now);
            }}
            style={{ width: 100 }}
          >
            {options}
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Travel Calendar</Title>
        <Button type="primary" onClick={openAddModal}>
          + Add Travel
        </Button>
      </div>

      <div className="calendar-container" style={{ 
        backgroundColor: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
      }}>
        <DayjsCalendar
          value={selectedDate}
          onSelect={date => setSelectedDate(date)}
          onPanelChange={date => setSelectedDate(date)}
          dateCellRender={dateCellRender}
          mode="month"
          fullscreen={true}
          headerRender={renderCalendarHeader}
          style={{ 
            border: '1px solid #f0f0f0',
            borderRadius: '4px'
          }}
        />
      </div>

      <Drawer
        title={`Travels on ${selectedDate.format('MMMM D, YYYY')}`}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
      >
        {selectedDateTravels.length === 0 ? (
          <div>No travels scheduled for this date</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedDateTravels.map(travel => (
              <Card
                key={travel.id}
                size="small"
                style={{
                  borderLeft: `3px solid ${travelTypeColors[travel.travel_type]}`
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <strong>Location:</strong> {travel.location}
                  </div>
                  <div>
                    <strong>Dates:</strong> {dayjs(travel.onward_date).format('MMM D')} - {dayjs(travel.return_date).format('MMM D, YYYY')}
                  </div>
                  <div>
                    <strong>Purpose:</strong> {travel.purpose}
                  </div>
                  <div>
                    <strong>Accommodation:</strong> {travel.accommodation}
                  </div>
                  {travel.remarks && (
                    <div>
                      <strong>Remarks:</strong> {travel.remarks}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Drawer>

      <Modal
        title={editingTravel ? 'Edit Travel' : 'Add Travel'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ travel_type: 'domestic' }}
        >
          <Form.Item
            name="travel_type"
            label="Type of Travel"
            rules={[{ required: true, message: 'Please select travel type' }]}
          >
            <Select>
              <Select.Option value="foreign">Foreign</Select.Option>
              <Select.Option value="domestic">Domestic</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please enter location' }]}
          >
            <Input placeholder="Enter city/country" />
          </Form.Item>

          <Form.Item
            name="onward_date"
            label="Onward Date"
            rules={[{ required: true, message: 'Please select onward date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="return_date"
            label="Return Date"
            rules={[{ required: true, message: 'Please select return date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true, message: 'Please enter purpose' }]}
          >
            <TextArea rows={2} placeholder="Enter purpose of travel" />
          </Form.Item>

          <Form.Item
            name="accommodation"
            label="Accommodation"
            rules={[{ required: true, message: 'Please enter accommodation details' }]}
          >
            <TextArea rows={2} placeholder="Enter accommodation details" />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <TextArea rows={2} placeholder="Enter any additional remarks" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EdofcTravelCalendarPage; 