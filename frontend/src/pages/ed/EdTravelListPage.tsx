import React, { useEffect, useState, useMemo } from 'react';
import { 
  Card, Tag, Space, Typography, message, List,
  Row, Col, Select, Radio
} from 'antd';
import { Travel, TravelType } from '../../types/travel';
import { getTravels } from '../../services/edoffice/travels';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

const { Title, Text } = Typography;
const { Option } = Select;

const travelTypeColors: Record<TravelType, string> = {
  foreign: 'purple',
  domestic: 'blue'
};

const travelTypeBgColors: Record<TravelType, string> = {
  foreign: '#f9f0ff',  // Light purple background
  domestic: '#e6f7ff'  // Light blue background
};

// Add custom styles for the cards
const cardStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'row' as const,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
};

const cardContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'row' as const,
  gap: '24px',
  padding: '16px',
};

const cardLeftSection = {
  flex: '0 0 200px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
  borderRight: '1px solid #f0f0f0',
  paddingRight: '24px',
};

const cardRightSection = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
};

const cardHeaderStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
};

const cardBodyStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
};

// Generate year options (current year ± 5 years)
const generateYearOptions = () => {
  const currentYear = dayjs().year();
  const years = [];
  for (let i = -5; i <= 5; i++) {
    const year = currentYear + i;
    years.push({
      label: year.toString(),
      value: year
    });
  }
  return years;
};

// Month options
const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 }
];

const yearOptions = generateYearOptions();

const EdTravelListPage: React.FC = () => {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TravelType | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const fetchTravels = async () => {
    try {
      setLoading(true);
      const data = await getTravels();
      console.log('Fetched travels:', data); // Debug log
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

  // Filter and sort travels
  const filteredAndSortedTravels = useMemo(() => {
    let filtered = [...travels];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(travel => travel.travel_type === typeFilter);
    }

    // Filter by year and month if selected
    if (selectedYear && selectedMonth) {
      const startOfMonth = dayjs().year(selectedYear).month(selectedMonth - 1).startOf('month');
      const endOfMonth = dayjs().year(selectedYear).month(selectedMonth - 1).endOf('month');
      
      filtered = filtered.filter(travel => {
        const travelDate = dayjs(travel.onward_date);
        return travelDate.isSameOrAfter(startOfMonth) && travelDate.isSameOrBefore(endOfMonth);
      });
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = dayjs(a.onward_date);
      const dateB = dayjs(b.onward_date);
      return dateA.valueOf() - dateB.valueOf(); // Always sort chronologically
    });
  }, [travels, typeFilter, selectedYear, selectedMonth]);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Travel List</Title>
      
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>Filter by:</Text>
            </Col>

            <Col>
              <Space>
                <Text strong>Month:</Text>
                <Select
                  style={{ width: 120 }}
                  placeholder="Select Year"
                  value={selectedYear}
                  onChange={setSelectedYear}
                  allowClear
                >
                  {yearOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
                <Select
                  style={{ width: 120 }}
                  placeholder="Select Month"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  disabled={!selectedYear}
                  allowClear
                >
                  {monthOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Space>
            </Col>

            <Col>
              <Space>
                <Text strong>Type:</Text>
                <Radio.Group 
                  value={typeFilter} 
                  onChange={e => setTypeFilter(e.target.value)}
                >
                  <Radio.Button value="all">All</Radio.Button>
                  <Radio.Button value="foreign">Foreign</Radio.Button>
                  <Radio.Button value="domestic">Domestic</Radio.Button>
                </Radio.Group>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <List
        dataSource={filteredAndSortedTravels}
        loading={loading}
        renderItem={travel => (
          <List.Item>
            <TravelCard travel={travel} />
          </List.Item>
        )}
      />
    </div>
  );
};

const TravelCard: React.FC<{ travel: Travel }> = ({ travel }) => {
  const isPast = dayjs(travel.return_date).isBefore(dayjs());
  return (
    <Card
      style={{
        ...cardStyle,
        borderLeft: `3px solid ${travelTypeColors[travel.travel_type]}`,
        backgroundColor: travelTypeBgColors[travel.travel_type],
        opacity: isPast ? 0.8 : 1
      }}
    >
      <div style={cardContentStyle}>
        <div style={cardLeftSection}>
          <div style={cardHeaderStyle}>
            <Space>
              <Tag color={travelTypeColors[travel.travel_type]}>
                {travel.travel_type.toUpperCase()}
              </Tag>
              {isPast && <Tag color="default">PAST</Tag>}
              <Title level={5} style={{ margin: 0 }}>{travel.location}</Title>
            </Space>
            <Space>
              <span>
                {dayjs(travel.onward_date).format('MMM D')} - {dayjs(travel.return_date).format('MMM D, YYYY')}
              </span>
            </Space>
          </div>
        </div>
        <div style={cardRightSection}>
          <div style={cardBodyStyle}>
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
        </div>
      </div>
    </Card>
  );
};

export default EdTravelListPage; 