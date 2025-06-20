import React, { useState, useEffect } from 'react';
import { Calendar, Modal, Form, Input, Select, Button, Tag, Space, message, Card, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Moment } from 'moment';
import { CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { getCalendarEvents, updateEventAttendance } from '../../services/edoffice/calendarEvents';
import type { CalendarEvent, AttendanceStatus } from '../../types/calendarEvent';
import '../edofc/calendar.css';

const { TextArea } = Input;

// Event type colors
const eventTypeColors: Record<string, string> = {
  event: 'purple',
  training: 'green',
  meeting: 'blue',
  other: 'orange'
};

const eventTypeLabels: Record<string, string> = {
  event: 'Event',
  training: 'Training',
  meeting: 'Meeting',
  other: 'Other'
};

// Create a wrapper component for icons
const IconWrapper: React.FC<{ icon: React.ComponentType<any> }> = ({ icon: Icon }) => (
  <Icon style={{ fontSize: '14px' }} />
);

// Attendance status colors and icons
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

// Add type definition for attendance status keys
type AttendanceStatusKey = 'attending' | 'not_attending' | 'sending_representative';

// Add status color mapping
const statusColors: Record<AttendanceStatusKey, string> = {
  attending: '#52c41a',      // success green
  not_attending: '#ff4d4f',  // error red
  sending_representative: '#faad14'  // warning orange
};

const EdCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Moment>(dayjs() as unknown as Moment);
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

  const openAttendanceModal = (event: CalendarEvent) => {
    form.resetFields();
    form.setFieldsValue({
      status: event.ed_attendance_status || undefined,
      remarks: event.ed_attendance_remarks || ''
    });
    setModalVisible(true);
    setSelectedEvent(event);
  };

  const handleAttendanceUpdate = async (values: { status: AttendanceStatus; remarks?: string }) => {
    if (!selectedEvent) return;

    try {
      const updatedEvent = await updateEventAttendance(
        selectedEvent.id,
        values.status,
        values.remarks
      );
      
      setEvents(events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
      
      message.success('Attendance status updated successfully');
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating attendance:', error);
      message.error('Failed to update attendance status');
    }
  };

  const dateCellRender = (value: Moment) => {
    const date = dayjs(value.toDate());
    const dayEvents = events.filter(event => 
      dayjs(event.start_time).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );

    return (
      <div className={`calendar-cell ${date.isSame(dayjs(), 'day') ? 'today' : ''} ${date.isBefore(dayjs(), 'day') ? 'past' : ''}`}>
        {dayEvents.map(event => {
          const isPast = dayjs(event.start_time).isBefore(dayjs().startOf('day'));
          const status = event.ed_attendance_status as AttendanceStatusKey;
          const statusConfig = status && status in attendanceStatusConfig ? attendanceStatusConfig[status] : null;
          
          return (
            <Tooltip 
              key={event.id}
              title={
                <div>
                  <div><strong>{event.title}</strong></div>
                  <div>{dayjs(event.start_time).format('h:mm A')} - {dayjs(event.end_time).format('h:mm A')}</div>
                  <div>Type: {eventTypeLabels[event.event_type]}</div>
                  {status && statusConfig && (
                    <div>
                      Status: {statusConfig.label}
                      {event.ed_attendance_remarks && <div>Remarks: {event.ed_attendance_remarks}</div>}
                    </div>
                  )}
                </div>
              }
            >
              <div 
                className="event-item"
                style={{ 
                  backgroundColor: eventTypeColors[event.event_type],
                  opacity: isPast ? 0.7 : 1
                }}
              >
                <div className="event-title">
                  {event.title}
                </div>
                {status && statusConfig && (
                  <div className="event-status-icon" style={{ color: statusColors[status] }}>
                    <IconWrapper icon={statusConfig.icon} />
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <style>
          {`
            .calendar-cell {
              min-height: 80px;
              padding: 4px;
              overflow: hidden;
            }
            .calendar-cell.today {
              background-color: #e6f7ff;
              border-radius: 4px;
            }
            .calendar-cell.past {
              background-color: #fafafa;
            }
            .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
              color: #1890ff;
              font-weight: bold;
            }
            /* Hide the navigation buttons but keep the select boxes */
            .ant-picker-calendar-header .ant-picker-calendar-header-controls {
              display: none !important;
            }
            .ant-picker-calendar-header {
              padding: 8px 0 !important;
            }
            /* Ensure the month/year select boxes are visible */
            .ant-picker-calendar-header .ant-picker-calendar-mode-switch {
              display: none !important;
            }
            .ant-picker-calendar-header .ant-picker-calendar-header-view {
              display: flex !important;
              justify-content: center !important;
            }
            /* Calendar cell content styles */
            .ant-picker-calendar-date-content {
              height: auto !important;
              overflow: hidden !important;
            }
            .ant-picker-calendar-date {
              padding: 4px !important;
            }
            .ant-picker-calendar-date-value {
              margin: 0 !important;
            }
            /* Event item styles */
            .event-item {
              margin-bottom: 2px;
              padding: 2px 4px;
              border-radius: 2px;
              color: white;
              font-size: 12px;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              overflow: hidden;
            }
            .event-title {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              padding-right: 4px;
            }
            .event-status-icon {
              flex-shrink: 0;
              display: flex;
              align-items: center;
              font-size: 14px;
            }
          `}
        </style>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space direction="horizontal" size="large">
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Event Types</div>
              <Space size="middle">
                {Object.entries(eventTypeLabels).map(([type, label]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: eventTypeColors[type],
                      borderRadius: '2px'
                    }} />
                    <span>{label}</span>
                  </div>
                ))}
              </Space>
            </div>
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Attendance Status</div>
              <Space size="middle">
                {Object.entries(attendanceStatusConfig).map(([status, config]) => (
                  <Tag key={status} color={config.color}>
                    <IconWrapper icon={config.icon} />
                    {config.label}
                  </Tag>
                ))}
              </Space>
            </div>
          </Space>
        </div>
        <Calendar
          dateCellRender={dateCellRender}
          value={selectedDate}
          onChange={(date: Moment) => setSelectedDate(date)}
        />
      </Card>
      <Modal
        title="Update Attendance Status"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedEvent(null);
          form.resetFields();
        }}
        footer={null}
      >
        {selectedEvent && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAttendanceUpdate}
            initialValues={{
              status: selectedEvent.ed_attendance_status || undefined,
              remarks: selectedEvent.ed_attendance_remarks
            }}
          >
            <Form.Item
              name="status"
              label="Attendance Status"
              rules={[{ required: true, message: 'Please select your attendance status' }]}
            >
              <Select>
                {Object.entries(attendanceStatusConfig).map(([status, config]) => (
                  <Select.Option key={status} value={status}>
                    <Space>
                      <Tag color={config.color}>
                        <IconWrapper icon={config.icon} />
                        {config.label}
                      </Tag>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="remarks"
              label="Remarks"
            >
              <TextArea rows={4} placeholder="Add any remarks about your attendance" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Status
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default EdCalendarPage; 