import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, Form, Input, DatePicker, TimePicker, Select, Button, List, Popconfirm, Tag, Space, Typography, message, Card, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../services/edoffice/calendarEvents';
import type { CalendarEvent, EventType, AttendanceStatus } from '../../types/calendarEvent';

const { TextArea } = Input;
const { Title, Text } = Typography;

// Extend dayjs with required plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(weekday);
dayjs.extend(localeData);

// Custom Calendar component that uses dayjs
const DayjsCalendar = Calendar as unknown as React.FC<CalendarProps<Dayjs>>;

// Create a wrapper component for icons
const IconWrapper: React.FC<{ icon: React.ComponentType<any> }> = ({ icon: Icon }) => (
  <Icon style={{ fontSize: '14px' }} />
);

// Event type colors - matching ED Calendar
const eventTypeColors: Record<EventType, string> = {
  event: 'purple',
  training: 'green',
  meeting: 'blue',
  other: 'orange'
};

// Add status color mapping
const statusColors: Record<AttendanceStatus, string> = {
  attending: '#52c41a',      // success green
  not_attending: '#ff4d4f',  // error red
  sending_representative: '#faad14'  // warning orange
};

// Add status config
const attendanceStatusConfig = {
  attending: {
    color: 'success',
    label: 'Attending',
    icon: CheckCircleOutlined
  },
  not_attending: {
    color: 'error',
    label: 'Not Attending',
    icon: CloseCircleOutlined
  },
  sending_representative: {
    color: 'warning',
    label: 'Sending Representative',
    icon: UserSwitchOutlined
  }
} as const;

const EdofcFullCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getCalendarEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAddModal = () => {
    form.resetFields();
    form.setFieldsValue({
      start_time: selectedDate,
      end_time: selectedDate.add(1, 'hour'),
      event_type: 'event' as EventType,
      reminder_minutes: 15,
      description: ''
    });
    setModalVisible(true);
    setSelectedEvent(null);
  };

  const openEditModal = (event: CalendarEvent) => {
    form.setFieldsValue({
      ...event,
      start_time: dayjs(event.start_time),
      end_time: dayjs(event.end_time)
    });
    setModalVisible(true);
    setSelectedEvent(event);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const eventData = {
        ...values,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString()
      };

      if (selectedEvent) {
        await updateCalendarEvent(selectedEvent.id, eventData);
        message.success('Event updated successfully');
      } else {
        await createCalendarEvent(eventData);
        message.success('Event created successfully');
      }

      fetchEvents();
      setModalVisible(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      message.error('Failed to save event');
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedEvent(null);
    form.resetFields();
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await deleteCalendarEvent(id);
      message.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      message.error('Failed to delete event');
    }
  };

  const renderEventTypeLegend = () => (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Title level={5} style={{ margin: 0 }}>Event Types:</Title>
          <Space>
            {Object.entries(eventTypeColors).map(([type, color]) => (
              <Tag key={type} color={color} style={{ 
                padding: '4px 8px',
                borderRadius: '4px',
                margin: '0 4px',
                border: 'none'
              }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Tag>
            ))}
          </Space>
        </Space>
        <Space wrap>
          <Title level={5} style={{ margin: 0 }}>Attendance Status:</Title>
          <Space>
            {Object.entries(attendanceStatusConfig).map(([status, config]) => (
              <Tag key={status} color={config.color}>
                <IconWrapper icon={config.icon} />
                {config.label}
              </Tag>
            ))}
          </Space>
        </Space>
      </Space>
    </Card>
  );

  const dateCellRender = (date: Dayjs) => {
    const eventsForDate = events.filter(ev =>
      date.isBetween(dayjs(ev.start_time), dayjs(ev.end_time), 'day', '[]')
    );

    return (
      <div>
        {eventsForDate.map(ev => {
          const isPast = dayjs(ev.start_time).isBefore(dayjs().startOf('day'));
          const status = ev.ed_attendance_status as AttendanceStatus;
          const statusConfig = status && status in attendanceStatusConfig ? attendanceStatusConfig[status] : null;

          return (
            <Tooltip
              key={ev.id}
              title={
                <div>
                  <div><strong>{ev.title}</strong></div>
                  <div>{ev.description}</div>
                  <div>{dayjs(ev.start_time).format('h:mm A')} - {dayjs(ev.end_time).format('h:mm A')}</div>
                  {ev.venue && <div>Venue: {ev.venue}</div>}
                  {ev.meeting_link && <div>Meeting Link: {ev.meeting_link}</div>}
                  {status && statusConfig && (
                    <div>
                      Status: {statusConfig.label}
                      {ev.ed_attendance_remarks && <div>Remarks: {ev.ed_attendance_remarks}</div>}
                    </div>
                  )}
                </div>
              }
              placement="right"
            >
              <div style={{ cursor: 'pointer', marginBottom: 2 }}>
                <div className="event-item" style={{ 
                  backgroundColor: eventTypeColors[ev.event_type],
                  opacity: isPast ? 0.7 : 1,
                  color: 'white',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div className="event-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.title}
                  </div>
                  {status && statusConfig && (
                    <div className="event-status-icon" style={{ color: statusColors[status] }}>
                      <IconWrapper icon={statusConfig.icon} />
                    </div>
                  )}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  // Get all events for the current month view
  const getMonthEvents = () => {
    const monthStart = selectedDate.startOf('month');
    const monthEnd = selectedDate.endOf('month');
    
    return events.filter(event => {
      const eventStart = dayjs(event.start_time);
      const eventEnd = dayjs(event.end_time);
      return eventStart.isSameOrBefore(monthEnd) && eventEnd.isSameOrAfter(monthStart);
    }).sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());
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
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '8px'
      }}>
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
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Calendar</Title>
        <Button 
          type="primary" 
          onClick={openAddModal}
        >
          + Add Event
        </Button>
      </div>

      {renderEventTypeLegend()}

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

      <div style={{ marginTop: 24 }}>
        <Title level={5}>Events for {selectedDate.format('MMMM YYYY')}</Title>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={getMonthEvents()}
          renderItem={event => {
            const isPast = dayjs(event.start_time).isBefore(dayjs().startOf('day'));
            const status = event.ed_attendance_status as AttendanceStatus;
            const statusConfig = status && status in attendanceStatusConfig ? attendanceStatusConfig[status] : null;

            return (
              <List.Item>
                <Card
                  hoverable
                  style={{
                    backgroundColor: event.event_type === 'meeting' ? '#e6f7ff' : 
                                    event.event_type === 'training' ? '#f6ffed' : 
                                    event.event_type === 'other' ? '#fff7e6' : '#f9f0ff',
                    borderLeft: `3px solid ${eventTypeColors[event.event_type]}`,
                    opacity: isPast ? 0.7 : 1
                  }}
                  actions={[
                    <Button 
                      type="text" 
                      onClick={() => openEditModal(event)}
                      style={{ color: '#1890ff' }}
                    >
                      Edit
                    </Button>,
                    <Popconfirm
                      title="Are you sure you want to delete this event?"
                      onConfirm={() => handleDeleteEvent(event.id)}
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
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space>
                          <Tag color={eventTypeColors[event.event_type]}>
                            {event.event_type}
                          </Tag>
                          <Text strong>{event.title}</Text>
                        </Space>
                        {status && statusConfig && (
                          <Tag color={statusConfig.color} style={{ margin: 0 }}>
                            <Space size={4}>
                              <IconWrapper icon={statusConfig.icon} />
                              {statusConfig.label}
                            </Space>
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0} style={{ marginTop: '8px' }}>
                        <Text type="secondary">
                          {dayjs(event.start_time).format('MMM D')}
                        </Text>
                        <Text type="secondary">
                          {dayjs(event.start_time).format('h:mm A')} - {dayjs(event.end_time).format('h:mm A')}
                        </Text>
                        {event.venue && <Text type="secondary">Venue: {event.venue}</Text>}
                        {event.meeting_link && <Text type="secondary">Meeting Link: {event.meeting_link}</Text>}
                        {event.description && <Text type="secondary">{event.description}</Text>}
                        {status && event.ed_attendance_remarks && (
                          <Text type="secondary" style={{ fontStyle: 'italic' }}>
                            Remarks: {event.ed_attendance_remarks}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            );
          }}
        />
      </div>

      <Modal
        title={selectedEvent ? 'Edit Event' : 'Add Event'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="event_type"
            label="Event Type"
            rules={[{ required: true, message: 'Please select event type' }]}
          >
            <Select>
              <Select.Option value="event">Event</Select.Option>
              <Select.Option value="meeting">Meeting</Select.Option>
              <Select.Option value="training">Training</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea />
          </Form.Item>
          <Form.Item
            name="start_time"
            label="Start Time"
            rules={[{ required: true, message: 'Please select start time' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="end_time"
            label="End Time"
            rules={[{ required: true, message: 'Please select end time' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="venue"
            label="Venue"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="meeting_link"
            label="Meeting Link"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="reminder_minutes"
            label="Reminder (minutes before)"
            rules={[{ required: true, message: 'Please enter reminder time' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EdofcFullCalendarPage; 