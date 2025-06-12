import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Input, TimePicker, List, message, Popconfirm, Card } from 'antd';
import { CalendarEvent } from '../../types/calendarEvent';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../../services/edoffice/calendarEvents';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import 'dayjs/locale/en';

const EdofcCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
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

  const openAddModal = () => {
    setEditingEvent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    form.setFieldsValue({
      ...event,
      startDate: dayjs(event.start_time).format('YYYY-MM-DD'),
      startTime: dayjs(event.start_time).format('HH:mm'),
      endDate: dayjs(event.end_time).format('YYYY-MM-DD'),
      endTime: dayjs(event.end_time).format('HH:mm'),
      venue: event.venue || '',
      meeting_link: event.meeting_link || '',
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
      const start = dayjs(`${values.startDate}T${values.startTime}`).format('YYYY-MM-DDTHH:mm:ss');
      const end = dayjs(`${values.endDate}T${values.endTime}`).format('YYYY-MM-DDTHH:mm:ss');
      
      const eventPayload = {
        title: values.title,
        description: values.description,
        start_time: start,
        end_time: end,
        venue: values.venue,
        meeting_link: values.meeting_link,
        reminder_minutes: values.reminder_minutes,
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

  return (
    <div style={{ padding: 24 }}>
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
          <Button type="primary" onClick={openAddModal}>
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