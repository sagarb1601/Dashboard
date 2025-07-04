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

interface TechnicalSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_publications: number;
  total_patents: number;
  total_proposals: number;
}

interface MonthlyData {
  month: string;
  project_count?: number;
  publication_count?: number;
  patent_count?: number;
  proposal_count?: number;
}

interface DistributionData {
  status?: string;
  project_type?: string;
  publication_type?: string;
  project_count?: number;
  publication_count?: number;
  patent_count?: number;
}

const TechnicalDashboard: React.FC = () => {
  const [summary, setSummary] = useState<TechnicalSummary>({
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    total_publications: 0,
    total_patents: 0,
    total_proposals: 0
  });
  const [projectsPerMonth, setProjectsPerMonth] = useState<MonthlyData[]>([]);
  const [publicationsPerMonth, setPublicationsPerMonth] = useState<MonthlyData[]>([]);
  const [patentsPerMonth, setPatentsPerMonth] = useState<MonthlyData[]>([]);
  const [proposalsPerMonth, setProposalsPerMonth] = useState<MonthlyData[]>([]);
  const [projectStatusDistribution, setProjectStatusDistribution] = useState<DistributionData[]>([]);
  const [projectTypeDistribution, setProjectTypeDistribution] = useState<DistributionData[]>([]);
  const [publicationsByType, setPublicationsByType] = useState<DistributionData[]>([]);
  const [patentsByStatus, setPatentsByStatus] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicalData();
  }, []);

  const fetchTechnicalData = async () => {
    try {
      setLoading(true);
      console.log('Fetching Technical Dashboard data...');
      
      // Fetch Technical summary
      const summaryRes = await fetch('/api/technical/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const summaryData = await summaryRes.json();
      console.log('Technical summary data:', summaryData);
      setSummary(summaryData);

      // Fetch projects per month
      const projectsRes = await fetch('/api/technical/dashboard/projects-per-month', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const projectsData = await projectsRes.json();
      console.log('Projects per month data:', projectsData);
      setProjectsPerMonth(projectsData);

      // Fetch publications per month
      const publicationsRes = await fetch('/api/technical/dashboard/publications-per-month', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const publicationsData = await publicationsRes.json();
      console.log('Publications per month data:', publicationsData);
      setPublicationsPerMonth(publicationsData);

      // Fetch patents per month
      const patentsRes = await fetch('/api/technical/dashboard/patents-per-month', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const patentsData = await patentsRes.json();
      console.log('Patents per month data:', patentsData);
      setPatentsPerMonth(patentsData);

      // Fetch proposals per month
      const proposalsRes = await fetch('/api/technical/dashboard/proposals-per-month', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const proposalsData = await proposalsRes.json();
      console.log('Proposals per month data:', proposalsData);
      setProposalsPerMonth(proposalsData);

      // Fetch project status distribution
      const statusRes = await fetch('/api/technical/dashboard/project-status-distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const statusData = await statusRes.json();
      console.log('Project status distribution data:', statusData);
      setProjectStatusDistribution(statusData);

      // Fetch project type distribution
      const typeRes = await fetch('/api/technical/dashboard/project-type-distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const typeData = await typeRes.json();
      console.log('Project type distribution data:', typeData);
      setProjectTypeDistribution(typeData);

      // Fetch publications by type
      const pubTypeRes = await fetch('/api/technical/dashboard/publications-by-type', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const pubTypeData = await pubTypeRes.json();
      console.log('Publications by type data:', pubTypeData);
      setPublicationsByType(pubTypeData);

      // Fetch patents by status
      const patentStatusRes = await fetch('/api/technical/dashboard/patents-by-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const patentStatusData = await patentStatusRes.json();
      console.log('Patents by status data:', patentStatusData);
      setPatentsByStatus(patentStatusData);

    } catch (error) {
      console.error('Error fetching Technical data:', error);
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
        <div style={{ marginTop: '16px' }}>Loading Technical Dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        🔬 Technical Projects Dashboard
      </Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Projects"
              value={summary.total_projects}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active Projects"
              value={summary.active_projects}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Completed Projects"
              value={summary.completed_projects}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Publications"
              value={summary.total_publications}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Patents"
              value={summary.total_patents}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Proposals"
              value={summary.total_proposals}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Monthly Trends Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Projects per Month */}
        <Col xs={24} lg={12}>
          <Card title="Projects Created per Month" style={{ height: '400px' }}>
            {projectsPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="project_count" 
                    stroke="#1890ff" 
                    name="Projects"
                    strokeWidth={3}
                    dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No project data available" />
            )}
          </Card>
        </Col>

        {/* Publications per Month */}
        <Col xs={24} lg={12}>
          <Card title="Publications per Month" style={{ height: '400px' }}>
            {publicationsPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={publicationsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="publication_count" 
                    stroke="#fa8c16" 
                    name="Publications"
                    strokeWidth={3}
                    dot={{ fill: '#fa8c16', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No publication data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Patents and Proposals per Month */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Patents per Month */}
        <Col xs={24} lg={12}>
          <Card title="Patents Filed per Month" style={{ height: '400px' }}>
            {patentsPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={patentsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="patent_count" 
                    stroke="#13c2c2" 
                    name="Patents"
                    strokeWidth={3}
                    dot={{ fill: '#13c2c2', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No patent data available" />
            )}
          </Card>
        </Col>

        {/* Proposals per Month */}
        <Col xs={24} lg={12}>
          <Card title="Proposals Submitted per Month" style={{ height: '400px' }}>
            {proposalsPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={proposalsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="proposal_count" 
                    stroke="#eb2f96" 
                    name="Proposals"
                    strokeWidth={3}
                    dot={{ fill: '#eb2f96', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No proposal data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Distribution Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Project Group Distribution - Pie Chart */}
        <Col xs={24} lg={12}>
          <Card title="Project Group Distribution" style={{ height: '400px' }}>
            {projectStatusDistribution.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={projectStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="project_count"
                    >
                      {projectStatusDistribution.map((entry, index) => (
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
                                {data.status}
                              </p>
                              <p style={{ margin: '0', color: '#666' }}>
                                Count: {data.project_count}
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
                  {projectStatusDistribution.map((entry, index) => (
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
                        {entry.status}: {entry.project_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="No project group data available" />
            )}
          </Card>
        </Col>

        {/* Project Group Distribution - Bar Chart */}
        <Col xs={24} lg={12}>
          <Card title="Projects by Group (Bar Chart)" style={{ height: '400px' }}>
            {projectTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectTypeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="project_type" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="project_count" fill="#52c41a" name="Projects" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No project group data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Additional Distribution Charts */}
      <Row gutter={[24, 24]}>
        {/* Publications by Type */}
        <Col xs={24} lg={12}>
          <Card title="Publications by Type" style={{ height: '400px' }}>
            {publicationsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={publicationsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="publication_type" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="publication_count" fill="#fa8c16" name="Publications" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No publication type data available" />
            )}
          </Card>
        </Col>

        {/* Patents by Status */}
        <Col xs={24} lg={12}>
          <Card title="Patents by Status" style={{ height: '400px' }}>
            {patentsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={patentsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="patent_count" fill="#13c2c2" name="Patents" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No patent status data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TechnicalDashboard; 