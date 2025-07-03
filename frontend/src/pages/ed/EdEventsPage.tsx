import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Modal, Form, Input, Select, message, Row, Col, Statistic, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getCalendarEvents, updateEventAttendance } from '../../services/edoffice/calendarEvents';
import type { CalendarEvent, AttendanceStatus } from '../../types/calendarEvent';
import dayjs from 'dayjs';
import { CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined, CalendarOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';

const { Title } = Typography;
const { TextArea } = Input;

// Add this type definition near the top of the file, after imports
type AttendanceStatusKey = 'attending' | 'not_attending' | 'sending_representative';

// Update the type definition near the top of the file
type StatusFilterType = AttendanceStatus | 'all' | 'not_set';

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

const EdEventsPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [monthFilter, setMonthFilter] = useState<string>(dayjs().format('YYYY-MM'));
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    attending: 0,
    notAttending: 0,
    sendingRepresentative: 0,
    notSet: 0
  });

  const fetchEvents = async () => {
    try {
      const data = await getCalendarEvents();
      console.log('Fetched events:', data);
      console.log('Number of events fetched:', data.length);
      setEvents(data);
      
      // Calculate statistics
      const stats = data.reduce((acc, event) => {
        console.log('Processing event:', event.id, event.title, 'Status:', event.ed_attendance_status);
        acc.total++;
        switch (event.ed_attendance_status) {
          case 'attending':
            acc.attending++;
            break;
          case 'not_attending':
            acc.notAttending++;
            break;
          case 'sending_representative':
            acc.sendingRepresentative++;
            break;
          default:
            acc.notSet++;
        }
        return acc;
      }, {
        total: 0,
        attending: 0,
        notAttending: 0,
        sendingRepresentative: 0,
        notSet: 0
      });

      console.log('Final stats:', stats);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpdateAttendance = async (values: { status: AttendanceStatus; remarks?: string }) => {
    if (!selectedEvent) return;

    try {
      await updateEventAttendance(selectedEvent.id, values.status, values.remarks);
      message.success('Attendance updated successfully');
      setModalVisible(false);
      fetchEvents();
    } catch (error) {
      console.error('Error updating attendance:', error);
      message.error('Failed to update attendance');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'not_set' ? !event.ed_attendance_status : event.ed_attendance_status === statusFilter);
    const matchesMonth = dayjs(event.start_time).format('YYYY-MM') === monthFilter;
    return matchesStatus && matchesMonth;
  });

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Attending', value: 'attending' },
    { label: 'Not Attending', value: 'not_attending' },
    { label: 'Sending Representative', value: 'sending_representative' },
    { label: 'Not Set', value: 'not_set' }
  ] as const;

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = dayjs().startOf('year').add(i, 'month');
    return {
      label: month.format('MMMM YYYY'),
      value: month.format('YYYY-MM')
    };
  });

  // Sort events: future events first, then past events
  const sortedAndFilteredEvents = React.useMemo(() => {
    const today = dayjs().startOf('day');
    return [...filteredEvents].sort((a, b) => {
      const aDate = dayjs(a.start_time);
      const bDate = dayjs(b.start_time);
      const aIsPast = aDate.isBefore(today);
      const bIsPast = bDate.isBefore(today);

      // If one is past and other isn't, future comes first
      if (aIsPast !== bIsPast) {
        return aIsPast ? 1 : -1;
      }

      // If both are past or both are future, sort by date
      return aDate.valueOf() - bDate.valueOf();
    });
  }, [filteredEvents]);

  const columns: ColumnsType<CalendarEvent> = [
    {
      title: 'Event Name',
      dataIndex: 'title',
      key: 'title',
      width: '35%',
      render: (text: string, record: CalendarEvent) => {
        const isPast = dayjs(record.start_time).isBefore(dayjs().startOf('day'));
        return (
          <div style={{ 
            color: isPast ? '#999' : 'inherit',
            fontStyle: isPast ? 'italic' : 'normal'
          }}>
            {text}
          </div>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'event_type',
      key: 'event_type',
      width: '15%',
      render: (type: string) => (
        <Tag color={
          type === 'event' ? 'purple' :
          type === 'training' ? 'green' :
          type === 'meeting' ? 'blue' : 'orange'
        }>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      width: '25%',
      render: (record: CalendarEvent) => {
        const isPast = dayjs(record.start_time).isBefore(dayjs().startOf('day'));
        return (
          <div style={{ 
            color: isPast ? '#999' : 'inherit',
            fontStyle: isPast ? 'italic' : 'normal'
          }}>
            {dayjs(record.start_time).format('MMM D, YYYY')}
            <br />
            {dayjs(record.start_time).format('h:mm A')} - {dayjs(record.end_time).format('h:mm A')}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'ed_attendance_status',
      key: 'ed_attendance_status',
      width: '25%',
      render: (status: AttendanceStatus, record: CalendarEvent) => {
        if (!status) return <Tag>Not Set</Tag>;
        const statusText = status === 'sending_representative' ? 'Sending Rep' : status.replace('_', ' ');
        const statusConfig = attendanceStatusConfig[status as AttendanceStatusKey];
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Tag color={
              status === 'attending' ? 'success' :
              status === 'not_attending' ? 'error' : 'warning'
            }>
              <Space>
                <IconWrapper icon={statusConfig.icon} />
                {statusText.toUpperCase()}
              </Space>
            </Tag>
            {record.ed_attendance_remarks && (
              <div style={{ 
                fontSize: '11px', 
                color: '#666', 
                fontStyle: 'italic',
                lineHeight: '1.2',
                maxWidth: '200px',
                wordWrap: 'break-word'
              }}>
                {record.ed_attendance_remarks}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Button 
          type="primary"
          size="small"
          onClick={() => {
            setSelectedEvent(record);
            form.setFieldsValue({
              status: record.ed_attendance_status,
              remarks: record.ed_attendance_remarks
            });
            setModalVisible(true);
          }}
        >
          Update
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '12px' }}>
      <Card>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Events"
                value={stats.total}
                prefix={<IconWrapper icon={CalendarOutlined} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Attending"
                value={stats.attending}
                valueStyle={{ color: '#52c41a' }}
                prefix={<IconWrapper icon={CheckCircleOutlined} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Not Attending"
                value={stats.notAttending}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<IconWrapper icon={CloseCircleOutlined} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Sending Representative"
                value={stats.sendingRepresentative}
                valueStyle={{ color: '#faad14' }}
                prefix={<IconWrapper icon={UserSwitchOutlined} />}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Status"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            {statusOptions.map(option => (
              <Select.Option key={option.value} value={option.value}>
                <Space>
                  {option.value === 'all' ? (
                    <Tag>All Status</Tag>
                  ) : option.value === 'not_set' ? (
                    <Tag>Not Set</Tag>
                  ) : (
                    <Tag color={attendanceStatusConfig[option.value as AttendanceStatusKey].color}>
                      <IconWrapper icon={attendanceStatusConfig[option.value as AttendanceStatusKey].icon} />
                      {option.label}
                    </Tag>
                  )}
                </Space>
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Month"
            value={monthFilter}
            onChange={setMonthFilter}
            allowClear
          >
            {monthOptions.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </div>
        <Table
          loading={loading}
          columns={columns}
          dataSource={sortedAndFilteredEvents}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} events`
          }}
          rowClassName={(record) => {
            const isPast = dayjs(record.start_time).isBefore(dayjs().startOf('day'));
            return isPast ? 'past-event-row' : '';
          }}
        />
      </Card>
      <style>
        {`
          .past-event-row {
            background-color: #fafafa;
          }
          .past-event-row:hover > td {
            background-color: #f5f5f5 !important;
          }
        `}
      </style>

      <Modal
        title="Update Attendance"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleUpdateAttendance}
          layout="vertical"
        >
          <Form.Item
            name="status"
            label="Attendance Status"
            rules={[{ required: true, message: 'Please select attendance status' }]}
          >
            <Select>
              <Select.Option value="attending">Attending</Select.Option>
              <Select.Option value="not_attending">Not Attending</Select.Option>
              <Select.Option value="sending_representative">Sending Representative</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EdEventsPage; 