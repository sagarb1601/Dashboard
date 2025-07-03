import React, { useEffect, useState } from 'react';
import { Calendar, Card, Tag, Space, Typography, message, Tooltip, Drawer, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { CalendarProps } from 'antd';
import { Travel, TravelType, TravelStatus } from '../../types/travel';
import { getTravels } from '../../services/edoffice/travels';
import isBetween from 'dayjs/plugin/isBetween';
import { CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';

dayjs.extend(isBetween);

const { Title } = Typography;

// Custom Calendar component that uses dayjs
const DayjsCalendar = Calendar as unknown as React.FC<CalendarProps<Dayjs>>;

const travelTypeColors: Record<TravelType, string> = {
  foreign: 'purple',
  domestic: 'blue'
};

// Travel status configuration
const travelStatusConfig = {
  going: {
    color: '#52c41a',
    label: 'Going',
    icon: CheckCircleOutlined
  },
  not_going: {
    color: '#ff4d4f',
    label: 'Not Going',
    icon: CloseCircleOutlined
  },
  deputing: {
    color: '#faad14',
    label: 'Deputing Someone',
    icon: UserSwitchOutlined
  }
} as const;

// Create a wrapper component for icons
const IconWrapper: React.FC<{ icon: React.ComponentType<any> }> = ({ icon: Icon }) => (
  <Icon style={{ fontSize: '12px' }} />
);

const CustomHeader: CalendarProps<Dayjs>['headerRender'] = ({ value, onChange }) => {
  const month = value.month();
  const year = value.year();

  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    monthOptions.push(
      <Select.Option key={i} value={i}>
        {dayjs().month(i).format('MMMM')}
      </Select.Option>
    );
  }

  const options = [];
  for (let i = year - 10; i < year + 10; i += 1) {
    options.push(
      <Select.Option key={i} value={i}>
        {i}
      </Select.Option>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tag color="purple">Foreign Travel</Tag>
          <Tag color="blue">Domestic Travel</Tag>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Select
            value={month}
            onChange={(newMonth: number) => {
              const now = value.clone().month(newMonth);
              onChange(now);
            }}
            style={{ width: 120 }}
          >
            {monthOptions}
          </Select>
          <Select
            value={year}
            onChange={(newYear: number) => {
              const now = value.clone().year(newYear);
              onChange(now);
            }}
            style={{ width: 100 }}
          >
            {options}
          </Select>
        </div>
      </div>
    </div>
  );
};

// Travel Calendar Legend Component
const TravelCalendarLegend: React.FC = () => {
  return (
    <div style={{ 
      marginBottom: '16px', 
      padding: '8px 12px', 
      backgroundColor: '#fafafa', 
      borderRadius: '6px',
      border: '1px solid #d9d9d9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', fontSize: '13px', marginRight: '8px' }}>
          Legend:
        </span>
        
        {/* Travel Types */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Travel Types:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div 
              style={{ 
                width: '10px', 
                height: '10px', 
                backgroundColor: travelTypeColors.foreign, 
                borderRadius: '2px',
                flexShrink: 0
              }} 
            />
            <span style={{ fontSize: '12px' }}>Foreign</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div 
              style={{ 
                width: '10px', 
                height: '10px', 
                backgroundColor: travelTypeColors.domestic, 
                borderRadius: '2px',
                flexShrink: 0
              }} 
            />
            <span style={{ fontSize: '12px' }}>Domestic</span>
          </div>
        </div>
        
        {/* Travel Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Status:</span>
          {Object.entries(travelStatusConfig).map(([status, config]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ color: config.color }}>
                <IconWrapper icon={config.icon} />
              </div>
              <span style={{ fontSize: '12px' }}>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EdTravelCalendarPage: React.FC = () => {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDateTravels, setSelectedDateTravels] = useState<Travel[]>([]);

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

  const handleDateClick = (date: Dayjs) => {
    const travelsForDate = travels.filter(travel =>
      date.isBetween(dayjs(travel.onward_date), dayjs(travel.return_date), 'day', '[]')
    );
    setSelectedDateTravels(travelsForDate);
    setDrawerVisible(true);
  };

  const dateCellRender = (date: Dayjs) => {
    // For month view, only show events for dates that belong to the currently viewed month
    const currentMonth = selectedDate.month();
    const currentYear = selectedDate.year();
    
    // Check if the date belongs to the current month view
    const isCurrentMonth = date.month() === currentMonth && date.year() === currentYear;
    
    // If it's not the current month, return a hidden placeholder
    if (!isCurrentMonth) {
      return (
        <div 
          className="other-month-placeholder" 
          style={{ 
            display: 'none',
            height: '0',
            minHeight: '0',
            padding: '0',
            margin: '0',
            border: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Hidden placeholder for other month dates */}
        </div>
      );
    }

    const travelsForDate = travels.filter(travel =>
      date.isBetween(dayjs(travel.onward_date), dayjs(travel.return_date), 'day', '[]')
    );

    return (
      <div onClick={() => handleDateClick(date)}>
        {travelsForDate.map(travel => {
          const status = travel.status as TravelStatus;
          const statusConfig = status && status in travelStatusConfig ? travelStatusConfig[status] : null;
          
          return (
            <Tooltip
              key={travel.id}
              title={
                <div>
                  <div><strong>{travel.location}</strong></div>
                  <div>{travel.purpose}</div>
                  <div>Accommodation: {travel.accommodation}</div>
                  {statusConfig && (
                    <div>Status: {statusConfig.label}</div>
                  )}
                  {travel.deputing_remarks && (
                    <div>Deputing: {travel.deputing_remarks}</div>
                  )}
                  {travel.remarks && <div>Remarks: {travel.remarks}</div>}
                </div>
              }
              placement="right"
            >
              <div style={{ cursor: 'pointer', marginBottom: 2 }}>
                <Tag color={travelTypeColors[travel.travel_type]} style={{ width: '100%', margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{travel.location}</span>
                    {statusConfig && (
                      <div style={{ color: statusConfig.color, marginLeft: '4px' }}>
                        <IconWrapper icon={statusConfig.icon} />
                      </div>
                    )}
                  </div>
                </Tag>
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Travel Calendar</Title>
      </div>

      {/* Travel Calendar Legend */}
      <TravelCalendarLegend />

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
          headerRender={CustomHeader}
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
      
      <style>
        {`
          /* Hide other month placeholders completely */
          .other-month-placeholder {
            display: none !important;
          }
          /* Make other month dates transparent and non-interactive */
          .ant-picker-calendar-date:has(.other-month-placeholder) {
            opacity: 0.1 !important;
            pointer-events: none !important;
            background-color: transparent !important;
          }
          /* Alternative: hide the date value for other month dates */
          .ant-picker-calendar-date:has(.other-month-placeholder) .ant-picker-calendar-date-value {
            opacity: 0.1 !important;
            color: #ccc !important;
          }
          .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
            color: #1890ff;
            font-weight: bold;
          }
        `}
      </style>
    </div>
  );
};

export default EdTravelCalendarPage; 