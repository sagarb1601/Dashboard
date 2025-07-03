import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Input, TimePicker, List, message, Popconfirm, Card, Tag, DatePicker, Select, Tooltip, Calendar, Space } from 'antd';
import { CalendarEvent, EventType } from '../../types/calendarEvent';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../../services/edoffice/calendarEvents';
import './calendar.css';
import moment, { Moment } from 'moment';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';
import 'dayjs/locale/en';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

// Event type colors
const eventTypeColors: Record<EventType, string> = {
  event: 'blue',
  training: 'green',
  meeting: 'purple',
  other: 'orange'
};

const EdofcCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
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

  const fetchEvents = async () => {
    try {
      const data = await getCalendarEvents();
      setEvents(data);
    } catch (err) {
      message.error('Failed to load events');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = dayjs(e.target.value);
    if (date.isValid()) {
      setSelectedDate(date);
    }
  };

  const openAddModal = (date: dayjs.Dayjs) => {
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({
      startDate: date.format('YYYY-MM-DD'),
      startTime: '09:00',
      endDate: date.format('YYYY-MM-DD'),
      endTime: '10:00',
      reminder_minutes: 15,
      event_type: 'event' // Set default event type
    });
    setModalVisible(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    form.setFieldsValue({
      title: event.title,
      description: event.description,
      venue: event.venue,
      meeting_link: event.meeting_link,
      startDate: dayjs(event.start_time).format('YYYY-MM-DD'),
      startTime: dayjs(event.start_time).format('HH:mm'),
      endDate: dayjs(event.end_time).format('YYYY-MM-DD'),
      endTime: dayjs(event.end_time).format('HH:mm'),
      reminder_minutes: event.reminder_minutes,
      event_type: event.event_type || 'event' // Ensure event_type has a default value
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCalendarEvent(id);
      message.success('Event deleted');
      fetchEvents();
    } catch {
      message.error('Failed to delete event');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Use local time string (IST) for DB
      const start = dayjs(`${values.startDate}T${values.startTime}`).format('YYYY-MM-DD HH:mm:ss');
      const end = dayjs(`${values.endDate}T${values.endTime}`).format('YYYY-MM-DD HH:mm:ss');
      const eventPayload = {
        title: values.title,
        description: values.description,
        start_time: start,
        end_time: end,
        venue: values.venue,
        meeting_link: values.meeting_link,
        reminder_minutes: values.reminder_minutes,
        event_type: values.event_type || 'event'
      };
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, eventPayload);
        message.success('Event updated');
      } else {
        await createCalendarEvent(eventPayload);
        message.success('Event created');
      }
      setModalVisible(false);
      fetchEvents();
    } catch (err) {
      // Validation error or API error
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  // Filter events for selected date
  const eventsForSelectedDate = events.filter(ev =>
    dayjs(ev.start_time).isSame(selectedDate, 'day')
  );

  // Custom cell renderer for calendar
  const dateCellRender = (date: Moment) => {
    // Only show events for dates that belong to the currently viewed month
    const currentMonth = selectedDate.month();
    const currentYear = selectedDate.year();
    
    // Check if the date belongs to the current month view
    const isCurrentMonth = date.month() === currentMonth && date.year() === currentYear;
    
    // If it's not the current month, show a disabled cell
    if (!isCurrentMonth) {
      return (
        <div 
          style={{
            opacity: 0.3,
            pointerEvents: 'none',
            color: '#ccc',
            backgroundColor: '#f5f5f5',
            height: '100%',
            minHeight: '60px'
          }}
        >
          {/* Empty cell for dates from other months */}
        </div>
      );
    }
    
    const eventsForDate = events.filter(ev =>
      dayjs(date.toDate()).isBetween(ev.start_time, ev.end_time, 'day', '[]')
    );

    // If there are more than 3 events, show a count with tooltip
    if (eventsForDate.length > 3) {
      return (
        <Tooltip 
          title={
            <div>
              {eventsForDate.map(ev => (
                <div key={ev.id} style={{ marginBottom: 4 }}>
                  <Tag color={eventTypeColors[ev.event_type]} style={{ margin: 0 }}>
                    {ev.title}
                  </Tag>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                    {dayjs(ev.start_time).format('h:mm A')} - {dayjs(ev.end_time).format('h:mm A')}
                  </div>
                </div>
              ))}
            </div>
          }
          placement="right"
        >
          <div style={{ cursor: 'pointer' }}>
            <Tag color="blue" style={{ width: '100%', margin: 0 }}>
              {eventsForDate.length} events
            </Tag>
          </div>
        </Tooltip>
      );
    }

    // Show up to 3 events directly in the cell with only icons and status
    return (
      <div>
        {eventsForDate.slice(0, 3).map(ev => (
          <Tooltip
            key={ev.id}
            title={
              <div>
                <div><strong>{ev.title}</strong></div>
                <div>{ev.description}</div>
                <div>{dayjs(ev.start_time).format('h:mm A')} - {dayjs(ev.end_time).format('h:mm A')}</div>
                {ev.venue && <div>Venue: {ev.venue}</div>}
                {ev.meeting_link && <div>Meeting Link: {ev.meeting_link}</div>}
              </div>
            }
            placement="right"
          >
            <div style={{ cursor: 'pointer', marginBottom: 2 }}>
              <Tag color={eventTypeColors[ev.event_type]} style={{ width: '100%', margin: 0, textAlign: 'center' }}>
                {ev.event_type === 'meeting' && '📅'}
                {ev.event_type === 'training' && '🎓'}
                {ev.event_type === 'event' && '📋'}
                {ev.event_type === 'other' && '📌'}
                {' '}
                {ev.event_type.toUpperCase()}
              </Tag>
            </div>
          </Tooltip>
        ))}
      </div>
    );
  };

  const handlePanelChange = (date: Moment, mode: string) => {
    setSelectedDate(dayjs(date.toDate()));
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2>Calendar</h2>
          <div style={{ marginTop: 8 }}>
            <Tag color="blue">Event</Tag>
            <Tag color="green">Training</Tag>
            <Tag color="purple">Meeting</Tag>
            <Tag color="orange">Other</Tag>
          </div>
        </div>
        <Button type="primary" onClick={() => openAddModal(selectedDate)}>
          Add Event
        </Button>
      </div>

      <div className="calendar-container">
        <Calendar
          value={moment(selectedDate.toDate())}
          onSelect={date => setSelectedDate(dayjs(date.toDate()))}
          onPanelChange={handlePanelChange}
          dateCellRender={dateCellRender}
          mode="month"
          headerRender={({ value, onChange }) => {
            const start = 0;
            const end = 12;
            const monthOptions = [];

            let current = value.clone();
            const localeData = value.localeData();
            const months = [];
            for (let i = 0; i < 12; i++) {
              current = current.month(i);
              months.push(localeData.monthsShort(current));
            }

            for (let i = start; i < end; i++) {
              monthOptions.push(
                <Select.Option key={i} value={i} className="month-item">
                  {months[i]}
                </Select.Option>
              );
            }

            const year = value.year();
            const month = value.month();
            const options = [];
            for (let i = year - 10; i < year + 10; i += 1) {
              options.push(
                <Select.Option key={i} value={i} className="year-item">
                  {i}
                </Select.Option>
              );
            }

            return (
              <div style={{ 
                padding: '8px 16px', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <Select
                  style={{ width: 100 }}
                  dropdownMatchSelectWidth={false}
                  value={year}
                  onChange={newYear => {
                    const now = moment(value.toDate()).year(newYear);
                    onChange(now);
                  }}
                >
                  {options}
                </Select>
                <Select
                  style={{ width: 100 }}
                  dropdownMatchSelectWidth={false}
                  value={month}
                  onChange={newMonth => {
                    const now = moment(value.toDate()).month(newMonth);
                    onChange(now);
                  }}
                >
                  {monthOptions}
                </Select>
              </div>
            );
          }}
        />
      </div>

      <Card>
        <h2>Calendar / Events</h2>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate.format('YYYY-MM-DD')}
            onChange={onDateChange}
            style={{ 
              padding: '4px 11px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              width: '200px'
            }}
          />
          <Button type="primary" onClick={() => openAddModal(selectedDate)}>
            Add Event
          </Button>
        </div>

        <h3>Events on {selectedDate.format('MMMM D, YYYY')}</h3>
        <List
          bordered
          dataSource={eventsForSelectedDate}
          renderItem={item => (
            <List.Item
              actions={[
                <a onClick={() => openEditModal(item)}>Edit</a>,
                <Popconfirm 
                  title="Delete this event?" 
                  onConfirm={() => handleDelete(item.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <a>Delete</a>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={item.title}
                description={
                  <>
                    <div>{item.description}</div>
                    <div>
                      {dayjs(item.start_time).format('h:mm A')} - {dayjs(item.end_time).format('h:mm A')}
                    </div>
                    {item.venue && <div>Venue: {item.venue}</div>}
                    {item.meeting_link && (
                      <div>
                        Meeting Link: <a href={item.meeting_link} target="_blank" rel="noopener noreferrer">{item.meeting_link}</a>
                      </div>
                    )}
                    <div>Reminder: {item.reminder_minutes} minutes before</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingEvent ? 'Edit Event' : 'Add Event'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item 
            name="event_type" 
            label="Event Type" 
            rules={[{ required: true, message: 'Please select event type' }]}
          >
            <Select>
              <Select.Option value="event">Event</Select.Option>
              <Select.Option value="training">Training</Select.Option>
              <Select.Option value="meeting">Meeting</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="title" 
            label="Title" 
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item 
            name="description" 
            label="Description"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item 
            name="venue" 
            label="Venue"
          >
            <Input placeholder="Enter meeting venue (optional)" />
          </Form.Item>
          <Form.Item 
            name="meeting_link" 
            label="Meeting Link"
          >
            <Input placeholder="Enter meeting link (optional)" />
          </Form.Item>
          <Form.Item 
            name="startDate" 
            label="Start Date" 
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <input type="date" style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item 
            name="startTime" 
            label="Start Time" 
            rules={[{ required: true, message: 'Please select start time' }]}
          >
            <input type="time" style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item 
            name="endDate" 
            label="End Date" 
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <input type="date" style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item 
            name="endTime" 
            label="End Time" 
            rules={[{ required: true, message: 'Please select end time' }]}
          >
            <input type="time" style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item 
            name="reminder_minutes" 
            label="Reminder (minutes before)" 
            initialValue={15}
            rules={[{ required: true, message: 'Please enter reminder time' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EdofcCalendarPage; 