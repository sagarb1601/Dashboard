import React, { useEffect, useState } from 'react';
import { Calendar, Card, Tag, Space, Typography, message, Tooltip, Drawer, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { CalendarProps } from 'antd';
import { Travel, TravelType } from '../../types/travel';
import { getTravels } from '../../services/edoffice/travels';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title } = Typography;

// Custom Calendar component that uses dayjs
const DayjsCalendar = Calendar as unknown as React.FC<CalendarProps<Dayjs>>;

const travelTypeColors: Record<TravelType, string> = {
  foreign: 'purple',
  domestic: 'blue'
};

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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Travel Calendar</Title>
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
    </div>
  );
};

export default EdTravelCalendarPage; 