import React, { useEffect, useState } from 'react';
import { Calendar, Badge, Modal, Button, Form, Input, message, DatePicker, List, Popconfirm } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import moment, { Moment } from 'moment';
import isBetween from 'dayjs/plugin/isBetween';
import { CalendarEvent } from '../../types/calendarEvent';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../../services/edoffice/calendarEvents';

const { RangePicker } = DatePicker;

dayjs.extend(isBetween);

const EdofcFullCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getCalendarEvents();
      setEvents(data);
    } catch (err) {
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAddModal = (date: Dayjs) => {
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({
      startDate: date.format('YYYY-MM-DD'),
      startTime: '09:00',
      endDate: date.format('YYYY-MM-DD'),
      endTime: '10:00',
      reminder_minutes: 15,
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
    });
    setModalVisible(true);
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
    setEditingEvent(null);
  };

  const handleDelete = async (id: number) => {
    await deleteCalendarEvent(id);
    message.success('Event deleted');
    fetchEvents();
  };

  // Multi-day event support: show event on all days it spans
  const dateCellRender = (date: Moment) => {
    const eventsForDate = events.filter(ev =>
      dayjs(date.toDate()).isBetween(ev.start_time, ev.end_time, 'day', '[]')
    );
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {eventsForDate.map(ev => (
          <li key={ev.id}>
            <Badge status="processing" text={ev.title} />
          </li>
        ))}
      </ul>
    );
  };

  // List of events for the selected date
  const eventsForSelectedDate = events.filter(ev =>
    dayjs(selectedDate.toDate()).isBetween(ev.start_time, ev.end_time, 'day', '[]')
  );

  // List of events for the selected month
  const eventsForSelectedMonth = events.filter(ev => {
    const eventStart = dayjs(ev.start_time);
    const eventEnd = dayjs(ev.end_time);
    const monthStart = selectedDate.startOf('month');
    const monthEnd = selectedDate.endOf('month');
    // Event overlaps with the month if it starts or ends in the month, or spans the month
    return (
      eventStart.isBetween(monthStart, monthEnd, 'day', '[]') ||
      eventEnd.isBetween(monthStart, monthEnd, 'day', '[]') ||
      (eventStart.isBefore(monthStart) && eventEnd.isAfter(monthEnd))
    );
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Full Calendar (New)</h2>
        <Button type="primary" onClick={() => openAddModal(selectedDate)}>Add Event</Button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <Calendar
          value={moment(selectedDate.toDate())}
          onSelect={date => setSelectedDate(dayjs(date.toDate()))}
          dateCellRender={dateCellRender}
        />
      </div>
      <div>
        <h3 style={{ marginTop: 0 }}>Events in {selectedDate.format('MMMM YYYY')}</h3>
        <List
          bordered
          dataSource={eventsForSelectedMonth}
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
                      {dayjs(item.start_time).format('YYYY-MM-DD h:mm A')} - {dayjs(item.end_time).format('YYYY-MM-DD h:mm A')}
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
      </div>
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

export default EdofcFullCalendarPage; 