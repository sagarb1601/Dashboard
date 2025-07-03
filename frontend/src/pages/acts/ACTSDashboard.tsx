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
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { Title, Text } = Typography;

// Chart colors
const CHART_COLORS = [
  '#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96',
  '#13c2c2', '#faad14', '#a0d911', '#2f54eb', '#f5222d'
];

interface ACTSSummary {
  total_courses: number;
  total_students_enrolled: number;
  total_students_placed: number;
  total_revenue: number;
  overall_placement_rate: number;
}

interface EnrollmentByCourse {
  course_name: string;
  total_enrolled: number;
}

interface PlacementByCourse {
  course_name: string;
  total_enrolled: number;
  total_placed: number;
  placement_rate: number;
}

interface RevenueByCourse {
  course_name: string;
  total_revenue: number;
  year: number;
}

interface EnrollmentTrends {
  year: number;
  total_enrolled: number;
  total_placed: number;
  placement_rate: number;
}

interface RevenueTrends {
  year: number;
  total_revenue: number;
  avg_course_fee: number;
}

interface BatchPerformance {
  batch_name: string;
  batch_id: string;
  course_name: string;
  students_enrolled: number;
  students_placed: number;
  placement_rate: number;
}

interface BatchSizeDistribution {
  batch_name: string;
  batch_size: number;
}

interface TopPerformingCourse {
  course_name: string;
  total_enrolled: number;
  total_placed: number;
  placement_rate: number;
  total_revenue: number;
}

const ACTSDashboard: React.FC = () => {
  const [summary, setSummary] = useState<ACTSSummary>({
    total_courses: 0,
    total_students_enrolled: 0,
    total_students_placed: 0,
    total_revenue: 0,
    overall_placement_rate: 0
  });
  const [enrollmentByCourse, setEnrollmentByCourse] = useState<EnrollmentByCourse[]>([]);
  const [placementByCourse, setPlacementByCourse] = useState<PlacementByCourse[]>([]);
  const [revenueByCourse, setRevenueByCourse] = useState<RevenueByCourse[]>([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState<EnrollmentTrends[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrends[]>([]);
  const [batchPerformance, setBatchPerformance] = useState<BatchPerformance[]>([]);
  const [batchSizeDistribution, setBatchSizeDistribution] = useState<BatchSizeDistribution[]>([]);
  const [topPerformingCourses, setTopPerformingCourses] = useState<TopPerformingCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchACTSData();
  }, []);

  const fetchACTSData = async () => {
    try {
      setLoading(true);
      console.log('Fetching ACTS dashboard data...');
      
      // Fetch summary data
      const summaryRes = await fetch('/api/acts/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const summaryData = await summaryRes.json();
      console.log('ACTS summary data:', summaryData);
      setSummary(summaryData);

      // Fetch enrollment by course
      const enrollmentRes = await fetch('/api/acts/dashboard/enrollment-by-course', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const enrollmentData = await enrollmentRes.json();
      console.log('Enrollment by course data:', enrollmentData);
      setEnrollmentByCourse(enrollmentData);

      // Fetch placement by course
      const placementRes = await fetch('/api/acts/dashboard/placement-by-course', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const placementData = await placementRes.json();
      console.log('Placement by course data:', placementData);
      setPlacementByCourse(placementData);

      // Fetch revenue by course
      const revenueRes = await fetch('/api/acts/dashboard/revenue-by-course', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const revenueData = await revenueRes.json();
      console.log('Revenue by course data:', revenueData);
      console.log('Revenue data length:', revenueData.length);
      console.log('Sample revenue item:', revenueData[0]);
      setRevenueByCourse(revenueData.map((row: any) => ({
        ...row,
        year: Number(row.year),
        total_revenue: Number(row.total_revenue)
      })));

      // Fetch enrollment trends
      const trendsRes = await fetch('/api/acts/dashboard/enrollment-trends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const trendsData = await trendsRes.json();
      console.log('Enrollment trends data:', trendsData);
      setEnrollmentTrends(trendsData);

      // Fetch revenue trends
      const revenueTrendsRes = await fetch('/api/acts/dashboard/revenue-trends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const revenueTrendsData = await revenueTrendsRes.json();
      console.log('Revenue trends data:', revenueTrendsData);
      setRevenueTrends(revenueTrendsData);

      // Fetch batch performance
      const batchRes = await fetch('/api/acts/dashboard/batch-performance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const batchData = await batchRes.json();
      console.log('Batch performance data:', batchData);
      setBatchPerformance(batchData);

      // Fetch batch size distribution
      const batchSizeRes = await fetch('/api/acts/dashboard/batch-size-distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const batchSizeData = await batchSizeRes.json();
      console.log('Batch size distribution data:', batchSizeData);
      setBatchSizeDistribution(batchSizeData);

      // Fetch top performing courses
      const topCoursesRes = await fetch('/api/acts/dashboard/top-performing-courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const topCoursesData = await topCoursesRes.json();
      console.log('Top performing courses data:', topCoursesData);
      setTopPerformingCourses(topCoursesData);

    } catch (error) {
      console.error('Error fetching ACTS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading ACTS dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        🎓 ACTS Dashboard
      </Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Courses"
              value={summary.total_courses}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Students Enrolled"
              value={summary.total_students_enrolled}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overall Placement Rate"
              value={summary.overall_placement_rate}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: '8px', color: '#fa8c16', fontSize: '12px' }}>
              📊 Placed: {summary.total_students_placed}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={formatCurrency(summary.total_revenue)}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Student Enrollment by Course (Year-wise) */}
        <Col xs={24} lg={12}>
          <Card title="Student Enrollment by Course (Year-wise)" style={{ height: '400px' }}>
            {enrollmentByCourse.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollmentByCourse}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course_name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_enrolled" fill="#1890ff" name="Students Enrolled" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No enrollment data available" />
            )}
          </Card>
        </Col>

        {/* Placement Rate by Course */}
        <Col xs={24} lg={12}>
          <Card title="Placement Rate by Course" style={{ height: '400px' }}>
            {placementByCourse.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={placementByCourse}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course_name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="placement_rate" fill="#52c41a" name="Placement Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No placement data available" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Enrollment Trends Over Years */}
        <Col xs={24} lg={12}>
          <Card title="Enrollment Trends Over Years" style={{ height: '400px' }}>
            {enrollmentTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_enrolled" 
                    stroke="#1890ff" 
                    name="Students Enrolled"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_placed" 
                    stroke="#52c41a" 
                    name="Students Placed"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No trend data available" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Revenue Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Revenue Distribution by Course" style={{ height: '400px' }}>
            {revenueByCourse.length > 0 ? (() => {
              // Aggregate revenue by course
              const courseRevenueMap = new Map();
              revenueByCourse.forEach(row => {
                if (!courseRevenueMap.has(row.course_name)) {
                  courseRevenueMap.set(row.course_name, 0);
                }
                courseRevenueMap.set(row.course_name, courseRevenueMap.get(row.course_name) + row.total_revenue);
              });
              
              const totalRevenue = Array.from(courseRevenueMap.values()).reduce((sum, revenue) => sum + revenue, 0);
              
              const tableData = Array.from(courseRevenueMap.entries())
                .map(([course_name, total_revenue]) => ({ 
                  course_name, 
                  total_revenue,
                  percentage: ((total_revenue / totalRevenue) * 100).toFixed(1),
                  formattedValue: total_revenue >= 10000000 ? 
                    `₹${(total_revenue / 10000000).toFixed(1)}Cr` :
                    total_revenue >= 100000 ? 
                    `₹${(total_revenue / 100000).toFixed(1)}L` :
                    `₹${(total_revenue / 1000).toFixed(0)}K`
                }))
                .sort((a, b) => b.total_revenue - a.total_revenue);

              return (
                <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>Course</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d9d9d9' }}>Revenue</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #d9d9d9', fontWeight: 'bold' }}>
                            {row.course_name}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d9d9d9', color: '#722ed1', fontWeight: 'bold' }}>
                            {row.formattedValue}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9', color: '#52c41a', fontWeight: 'bold' }}>
                            {row.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })() : (
              <Empty description="No revenue data available" />
            )}
          </Card>
        </Col>

        {/* Revenue Trends Over Years */}
        <Col xs={24} lg={12}>
          <Card title="Revenue Trends Over Years" style={{ height: '400px' }}>
            {revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 10000000) {
                        return `₹${(value / 10000000).toFixed(1)}Cr`;
                      } else if (value >= 100000) {
                        return `₹${(value / 100000).toFixed(1)}L`;
                      } else {
                        return `₹${(value / 1000).toFixed(0)}K`;
                      }
                    }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_revenue" 
                    stroke="#722ed1" 
                    name="Total Revenue"
                    strokeWidth={3}
                    dot={{ fill: '#722ed1', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No revenue trend data available" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Batch Performance Table */}
        <Col xs={24}>
          <Card title="Batch Performance Comparison">
            {batchPerformance.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>Batch Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>Course</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>Enrolled</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>Placed</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>Placement Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchPerformance.map((batch, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #d9d9d9' }}>{batch.batch_name}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #d9d9d9' }}>{batch.course_name}</td>
                        <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>{batch.students_enrolled}</td>
                        <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>{batch.students_placed}</td>
                        <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>
                          <span style={{ 
                            color: batch.placement_rate >= 80 ? '#52c41a' : 
                                   batch.placement_rate >= 60 ? '#fa8c16' : '#f5222d',
                            fontWeight: 'bold'
                          }}>
                            {batch.placement_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty description="No batch performance data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Batch Size Overview */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title="Batch Size Overview">
            {batchSizeDistribution.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {batchSizeDistribution.map((batch, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '16px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '8px',
                      minWidth: '200px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{batch.batch_name}</div>
                    <div style={{ fontSize: '24px', color: '#1890ff', fontWeight: 'bold' }}>
                      {batch.batch_size} Students
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No batch data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ACTSDashboard; 