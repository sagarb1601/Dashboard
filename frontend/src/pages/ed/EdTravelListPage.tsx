import React, { useEffect, useState, useMemo } from 'react';
import { 
  Card, Tag, Space, Typography, message, List,
  Row, Col, Select, Radio, Button, Empty, Modal, Input
} from 'antd';
import { Travel, TravelType, TravelStatus } from '../../types/travel';
import { getTravels, updateTravelStatus } from '../../services/edoffice/travels';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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

const getStatusColor = (status: TravelStatus) => {
  switch (status) {
    case 'going': return 'green';
    case 'not_going': return 'red';
    case 'deputing': return 'orange';
    default: return 'default';
  }
};

const getStatusText = (status: TravelStatus) => {
  switch (status) {
    case 'going': return 'Going';
    case 'not_going': return 'Not Going';
    case 'deputing': return 'Deputing Someone';
    default: return 'Unknown';
  }
};

const EdTravelListPage: React.FC = () => {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TravelType | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TravelStatus>('going');
  const [deputingRemarks, setDeputingRemarks] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

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

    // Filter by view mode (upcoming/past)
    const now = dayjs();
    if (viewMode === 'upcoming') {
      filtered = filtered.filter(travel => dayjs(travel.return_date).isAfter(now));
    } else {
      filtered = filtered.filter(travel => dayjs(travel.return_date).isSameOrBefore(now));
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = dayjs(a.onward_date);
      const dateB = dayjs(b.onward_date);
      return dateA.valueOf() - dateB.valueOf(); // Always sort chronologically
    });
  }, [travels, typeFilter, selectedYear, selectedMonth, viewMode]);

  const handleStatusUpdate = async () => {
    if (!selectedTravel) return;

    try {
      setStatusLoading(true);
      const statusData = {
        status: selectedStatus,
        ...(selectedStatus === 'deputing' && { deputing_remarks: deputingRemarks })
      };

      const updatedTravel = await updateTravelStatus(selectedTravel.id, statusData);
      
      // Update the travel in the list
      setTravels(prev => prev.map(travel => 
        travel.id === selectedTravel.id ? updatedTravel : travel
      ));

      message.success('Travel status updated successfully');
      setStatusModalVisible(false);
      setSelectedTravel(null);
      setSelectedStatus('going');
      setDeputingRemarks('');
    } catch (error) {
      message.error('Failed to update travel status');
    } finally {
      setStatusLoading(false);
    }
  };

  const openStatusModal = (travel: Travel) => {
    setSelectedTravel(travel);
    setSelectedStatus(travel.status);
    setDeputingRemarks(travel.deputing_remarks || '');
    setStatusModalVisible(true);
  };

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
            <Col>
              <Space>
                <Text strong>View:</Text>
                <Button.Group>
                  <Button 
                    type={viewMode === 'upcoming' ? 'primary' : 'default'}
                    onClick={() => setViewMode('upcoming')}
                  >
                    Upcoming Travels
                  </Button>
                  <Button 
                    type={viewMode === 'past' ? 'primary' : 'default'}
                    onClick={() => setViewMode('past')}
                  >
                    Past Travels
                  </Button>
                </Button.Group>
              </Space>
            </Col>
            <Col>
              <Text type="secondary">
                Showing {filteredAndSortedTravels.length} {viewMode} travel{filteredAndSortedTravels.length !== 1 ? 's' : ''}
              </Text>
            </Col>
          </Row>
        </Space>
      </Card>

      {filteredAndSortedTravels.length === 0 ? (
        <Card>
          <Empty
            description={`No ${viewMode} travels found`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <List
          dataSource={filteredAndSortedTravels}
          loading={loading}
          renderItem={travel => (
            <List.Item>
              <TravelCard 
                travel={travel} 
                onStatusUpdate={openStatusModal}
              />
            </List.Item>
          )}
        />
      )}

      {/* Status Update Modal */}
      <Modal
        title="Update Travel Status"
        open={statusModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => {
          setStatusModalVisible(false);
          setSelectedTravel(null);
          setSelectedStatus('going');
          setDeputingRemarks('');
        }}
        confirmLoading={statusLoading}
        okText="Update Status"
        cancelText="Cancel"
      >
        {selectedTravel && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Travel:</Text>
              <br />
              <Text>{selectedTravel.location} - {dayjs(selectedTravel.onward_date).format('MMM D')} to {dayjs(selectedTravel.return_date).format('MMM D, YYYY')}</Text>
            </div>
            
            <div>
              <Text strong>Status:</Text>
              <br />
              <Radio.Group 
                value={selectedStatus} 
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ marginTop: 8 }}
              >
                <Space direction="vertical">
                  <Radio value="going">Going</Radio>
                  <Radio value="not_going">Not Going</Radio>
                  <Radio value="deputing">Deputing Someone</Radio>
                </Space>
              </Radio.Group>
            </div>

            {selectedStatus === 'deputing' && (
              <div>
                <Text strong>Who are you deputing?</Text>
                <br />
                <TextArea
                  value={deputingRemarks}
                  onChange={e => setDeputingRemarks(e.target.value)}
                  placeholder="Enter the name of the person you are deputing"
                  rows={3}
                  style={{ marginTop: 8 }}
                />
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

const TravelCard: React.FC<{ travel: Travel; onStatusUpdate: (travel: Travel) => void }> = ({ travel, onStatusUpdate }) => {
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
            <div style={{ marginTop: 12 }}>
              <Space>
                <Text strong>Status:</Text>
                <Tag color={getStatusColor(travel.status)}>
                  {getStatusText(travel.status)}
                </Tag>
                <Button 
                  size="small" 
                  type="primary"
                  onClick={() => onStatusUpdate(travel)}
                >
                  Update Status
                </Button>
              </Space>
            </div>
            {travel.status === 'deputing' && travel.deputing_remarks && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <strong>Deputing:</strong> {travel.deputing_remarks}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EdTravelListPage; 