import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Empty,
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { Title } = Typography;

interface MMGSummary {
  total_procurements: number;
  pending_approvals: number;
  active_bids: number;
  completed_pos: number;
}

interface MonthlyData {
  month: string;
  procurement_count?: number;
  bid_count?: number;
  po_count?: number;
}

interface DistributionData {
  purchase_type?: string;
  sourcing_method?: string;
  delivery_place?: string;
  status?: string;
  procurement_count: number;
  total_value?: number;
}

const MMGDashboard: React.FC = () => {
  const [summary, setSummary] = useState<MMGSummary>({
    total_procurements: 0,
    pending_approvals: 0,
    active_bids: 0,
    completed_pos: 0
  });
  const [procurementsPerMonth, setProcurementsPerMonth] = useState<MonthlyData[]>([]);
  const [bidsPerMonth, setBidsPerMonth] = useState<MonthlyData[]>([]);
  const [posPerMonth, setPosPerMonth] = useState<MonthlyData[]>([]);
  const [procurementByType, setProcurementByType] = useState<DistributionData[]>([]);
  const [sourcingMethodDistribution, setSourcingMethodDistribution] = useState<DistributionData[]>([]);
  const [deliveryPlaceDistribution, setDeliveryPlaceDistribution] = useState<DistributionData[]>([]);
  const [procurementStatus, setProcurementStatus] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMMGData();
  }, []);

  const fetchMMGData = async () => {
    try {
      setLoading(true);
      console.log('Fetching MMG dashboard data...');
      
      // Fetch MMG summary
      const summaryRes = await fetch('/api/mmg/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const summaryData = await summaryRes.json();
      console.log('MMG summary data:', summaryData);
      setSummary(summaryData);

      // Fetch procurements per month
      const procurementsRes = await fetch('/api/mmg/dashboard/procurements-per-month', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const procurementsData = await procurementsRes.json();
      console.log('Procurements per month data:', procurementsData);
      setProcurementsPerMonth(procurementsData);

      // Fetch bids per month
      const bidsRes = await fetch('/api/mmg/dashboard/bids-per-month', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const bidsData = await bidsRes.json();
      console.log('Bids per month data:', bidsData);
      setBidsPerMonth(bidsData);

      // Fetch purchase orders per month
      const posRes = await fetch('/api/mmg/dashboard/pos-per-month', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const posData = await posRes.json();
      console.log('Purchase orders per month data:', posData);
      setPosPerMonth(posData);

      // Fetch procurement by type
      const typeRes = await fetch('/api/mmg/dashboard/procurement-by-type', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const typeData = await typeRes.json();
      console.log('Procurement by type data:', typeData);
      setProcurementByType(typeData);

      // Fetch sourcing method distribution
      const sourcingRes = await fetch('/api/mmg/dashboard/sourcing-method-distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const sourcingData = await sourcingRes.json();
      console.log('Sourcing method distribution data:', sourcingData);
      setSourcingMethodDistribution(sourcingData);

      // Fetch delivery place distribution
      const deliveryRes = await fetch('/api/mmg/dashboard/delivery-place-distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const deliveryData = await deliveryRes.json();
      console.log('Delivery place distribution data:', deliveryData);
      setDeliveryPlaceDistribution(deliveryData);

      // Fetch procurement status
      const statusRes = await fetch('/api/mmg/dashboard/procurement-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const statusData = await statusRes.json();
      console.log('Procurement status data:', statusData);
      setProcurementStatus(statusData);

    } catch (error) {
      console.error('Error fetching MMG data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '0', color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading MMG dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        📦 MMG Dashboard
      </Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Procurements"
              value={summary.total_procurements}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={summary.pending_approvals}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Bids"
              value={summary.active_bids}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed POs"
              value={summary.completed_pos}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Monthly Trends Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Procurements per Month */}
        <Col xs={24} lg={12}>
          <Card title="Procurements per Month" style={{ height: '400px' }}>
            {procurementsPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={procurementsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="procurement_count" 
                    stroke="#1890ff" 
                    name="Procurements"
                    strokeWidth={3}
                    dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No procurement data available" />
            )}
          </Card>
        </Col>

        {/* Bids per Month */}
        <Col xs={24} lg={12}>
          <Card title="Bids per Month" style={{ height: '400px' }}>
            {bidsPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bidsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="bid_count" 
                    stroke="#52c41a" 
                    name="Bids"
                    strokeWidth={3}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No bid data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Purchase Orders per Month */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card title="Purchase Orders per Month" style={{ height: '400px' }}>
            {posPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={posPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="po_count" 
                    stroke="#722ed1" 
                    name="Purchase Orders"
                    strokeWidth={3}
                    dot={{ fill: '#722ed1', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No purchase order data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Distribution Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Procurement by Type */}
        <Col xs={24} lg={12}>
          <Card title="Procurement by Type" style={{ height: '400px' }}>
            {procurementByType.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={procurementByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="procurement_count"
                    >
                      {procurementByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{ 
                              backgroundColor: 'white', 
                              padding: '10px', 
                              border: '1px solid #ccc', 
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}>
                              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                                {data.purchase_type}
                              </p>
                              <p style={{ margin: '0', color: '#666' }}>
                                Count: {data.procurement_count}
                              </p>
                              <p style={{ margin: '0', color: '#666' }}>
                                Value: ₹{data.total_value?.toLocaleString() || '0'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
                  {procurementByType.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: COLORS[index % COLORS.length],
                          borderRadius: '2px'
                        }}
                      />
                      <span style={{ fontSize: '12px' }}>
                        {entry.purchase_type}: {entry.procurement_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="No procurement type data available" />
            )}
          </Card>
        </Col>

        {/* Sourcing Method Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Sourcing Method Distribution" style={{ height: '400px' }}>
            {sourcingMethodDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourcingMethodDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sourcing_method" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="procurement_count" fill="#13c2c2" name="Procurements" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No sourcing method data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Additional Distribution Charts */}
      <Row gutter={[24, 24]}>
        {/* Delivery Place Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Delivery Place Distribution" style={{ height: '400px' }}>
            {deliveryPlaceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deliveryPlaceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="delivery_place" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="procurement_count" fill="#eb2f96" name="Procurements" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No delivery place data available" />
            )}
          </Card>
        </Col>

        {/* Procurement Status */}
        <Col xs={24} lg={12}>
          <Card title="Procurement Status Distribution" style={{ height: '400px' }}>
            {procurementStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={procurementStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="procurement_count" fill="#faad14" name="Procurements" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No procurement status data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MMGDashboard; 