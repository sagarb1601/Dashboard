import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Table, Tag, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { getCalendarEvents } from '../../services/edoffice/calendarEvents';
import type { CalendarEvent, AttendanceStatus } from '../../types/calendarEvent';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;

const EdAttendancePage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
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
      setEvents(data);
      
      // Calculate statistics
      const stats = data.reduce((acc, event) => {
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

      setStats(stats);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const columns: ColumnsType<CalendarEvent> = [
    {
      title: 'Event Name',
      dataIndex: 'title',
      key: 'title',
      width: '30%',
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      width: '20%',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.start_time).format('MMM D, YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(record.start_time).format('h:mm A')} - {dayjs(record.end_time).format('h:mm A')}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'event_type',
      key: 'event_type',
      width: '10%',
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
      title: 'Status',
      dataIndex: 'ed_attendance_status',
      key: 'ed_attendance_status',
      width: '15%',
      render: (status: AttendanceStatus) => {
        if (!status) return <Tag>Not Set</Tag>;
        const statusText = status === 'sending_representative' ? 'Sending Rep' : status.replace('_', ' ');
        return (
          <Space>
            {status === 'attending' && (
              <CheckCircleOutlined 
                style={{ color: '#52c41a' }}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              />
            )}
            {status === 'not_attending' && (
              <CloseCircleOutlined 
                style={{ color: '#ff4d4f' }}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              />
            )}
            {status === 'sending_representative' && (
              <UserSwitchOutlined 
                style={{ color: '#faad14' }}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              />
            )}
            <Tag color={
              status === 'attending' ? 'success' :
              status === 'not_attending' ? 'error' : 'warning'
            }>
              {statusText.toUpperCase()}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Remarks',
      dataIndex: 'ed_attendance_remarks',
      key: 'ed_attendance_remarks',
      width: '25%',
      ellipsis: true,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Attendance Overview</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={stats.total}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Attending"
              value={stats.attending}
              valueStyle={{ color: '#52c41a' }}
              prefix={
                <CheckCircleOutlined 
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                />
              }
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Not Attending"
              value={stats.notAttending}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={
                <CloseCircleOutlined 
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                />
              }
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sending Representative"
              value={stats.sendingRepresentative}
              valueStyle={{ color: '#faad14' }}
              prefix={
                <UserSwitchOutlined 
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                />
              }
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Event Attendance Details">
        <Table
          columns={columns}
          dataSource={events}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default EdAttendancePage; 