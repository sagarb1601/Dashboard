import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Typography,
  Space,
  Spin,
  Alert,
  Tag,
  Select,
  Button
} from 'antd';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../../utils/api';

const { Title, Text } = Typography;
const CHART_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#faad14'];

const FinanceDashboardTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [groupProjects, setGroupProjects] = useState<any[]>([]);
  const [projectStatus, setProjectStatus] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [budgetVsExpenditure, setBudgetVsExpenditure] = useState<any[]>([]);
  const [remainingBudget, setRemainingBudget] = useState<any[]>([]);
  const [fundingOverview, setFundingOverview] = useState<any[]>([]);
  const [grantHistory, setGrantHistory] = useState<any[]>([]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<number>(new Date().getFullYear());

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null) {
      return '0';
    }
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    // Format in crores or lakhs based on value
    if (absAmount >= 10000000) { // 1 crore or more
      const crores = absAmount / 10000000;
      const formatted = crores.toFixed(2).replace(/\.00$/, '');
      const result = `₹${formatted} Cr`;
      return isNegative ? `(${result})` : result;
    } else if (absAmount >= 100000) { // 1 lakh or more
      const lakhs = absAmount / 100000;
      const formatted = lakhs.toFixed(2).replace(/\.00$/, '');
      const result = `₹${formatted} L`;
      return isNegative ? `(${result})` : result;
    } else {
      // For smaller amounts, use regular formatting
      const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(absAmount);
      const result = `₹${formatted}`;
      return isNegative ? `(${result})` : result;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'green';
      case 'Ongoing':
        return 'blue';
      case 'Pending':
        return 'orange';
      case 'On Hold':
        return 'red';
      default:
        return 'default';
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        summaryRes,
        groupProjectsRes,
        projectStatusRes,
        monthlyTrendRes,
        topProjectsRes,
        budgetVsExpenditureRes,
        remainingBudgetRes,
        fundingOverviewRes,
        grantHistoryRes
      ] = await Promise.all([
        api.get('/finance/dashboard/summary'),
        api.get('/finance/dashboard/group-projects'),
        api.get('/finance/dashboard/project-status'),
        api.get('/finance/dashboard/monthly-trend'),
        api.get('/finance/dashboard/top-projects'),
        api.get('/finance/dashboard/budget-vs-expenditure'),
        api.get('/finance/dashboard/remaining-budget'),
        api.get('/finance/dashboard/funding-overview'),
        api.get('/finance/dashboard/grant-history')
      ]);

      setSummary(summaryRes.data);
      setGroupProjects(groupProjectsRes.data);
      setProjectStatus(projectStatusRes.data);
      setMonthlyTrend(monthlyTrendRes.data);
      setTopProjects(topProjectsRes.data);
      setBudgetVsExpenditure(budgetVsExpenditureRes.data);
      setRemainingBudget(remainingBudgetRes.data);
      setFundingOverview(fundingOverviewRes.data);
      setGrantHistory(grantHistoryRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedFinancialYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const topProjectsColumns = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
    },
    {
      title: 'Group',
      dataIndex: 'group_name',
      key: 'group_name',
    },
    {
      title: 'Total Budget',
      dataIndex: 'total_budget',
      key: 'total_budget',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Total Spent',
      dataIndex: 'total_spent',
      key: 'total_spent',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Pending Amount',
      dataIndex: 'pending_amount',
      key: 'pending_amount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading Finance Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="link" onClick={fetchDashboardData} style={{ color: '#1890ff', padding: 0 }}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const pieChartData = (projectStatus || []).map(item => ({ name: item.status, value: item.count }));
  const groupBarChartData = (groupProjects || []).map(item => ({ name: item.group_name, Budget: item.total_budget, Spent: item.total_spent }));

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Finance Dashboard</Title>
      
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={summary?.total_projects || 0}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '8px', color: '#1890ff', fontSize: '12px' }}>
              📊 Total Projects
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Project Value"
              value={summary?.total_value || 0}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: '8px', color: '#52c41a', fontSize: '12px' }}>
              💰 Total Value
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Funding Agencies"
              value={fundingOverview.length}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: '8px', color: '#722ed1', fontSize: '12px' }}>
              🏢 Agencies
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Grant Amount"
              value={grantHistory.reduce((sum, item) => sum + item.amount_received, 0)}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#eb2f96' }}
            />
            <div style={{ marginTop: '8px', color: '#eb2f96', fontSize: '12px' }}>
              💸 Total Grants
            </div>
          </Card>
        </Col>
      </Row>

      {/* Project Status Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Project Status Distribution">
            <Space direction="vertical" style={{ width: '100%' }}>
              {(projectStatus || []).map((status) => (
                <div key={status.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>{status.status}</Text>
                    <Text strong>{status.count} projects</Text>
                  </div>
                  <Progress
                    percent={Math.round((status.count / (summary?.total_projects || 1)) * 100)}
                    strokeColor={getStatusColor(status.status)}
                    showInfo={false}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Value: {formatCurrency(status.value)}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Projects by Technical Group">
            <Space direction="vertical" style={{ width: '100%' }}>
              {(groupProjects || []).slice(0, 5).map((group) => (
                <div key={group.group_name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>{group.group_name}</Text>
                    <Text strong>{group.project_count} projects</Text>
                  </div>
                  <Progress
                    percent={Math.round((group.total_spent / group.total_budget) * 100)}
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Budget: {formatCurrency(group.total_budget)} | Spent: {formatCurrency(group.total_spent)}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Project Status Pie Chart */}
        <Col xs={24} lg={12}>
          <Card title="Project Status Distribution" style={{ height: '400px' }}>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Projects']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">No project status data available</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Group-wise Projects Bar Chart */}
        <Col xs={24} lg={12}>
          <Card title="Group-wise Project Budget vs Spent" style={{ height: '400px' }}>
            {groupBarChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={groupBarChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 10000000) {
                        return (value / 10000000).toFixed(1) + 'Cr';
                      } else if (value >= 100000) {
                        return (value / 100000).toFixed(1) + 'L';
                      } else if (value >= 1000) {
                        return (value / 1000).toFixed(1) + 'K';
                      }
                      return value.toString();
                    }}
                    tick={{ fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    labelStyle={{ color: '#333', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar dataKey="Budget" fill="#1890ff" name="Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#52c41a" name="Spent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">No group project data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Monthly Trends Line Chart */}
      {(monthlyTrend || []).length > 0 && (
        <Card title="Monthly Spending Trends" style={{ marginBottom: '24px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={(monthlyTrend || []).map(item => ({ month: item.month_name, spent: item.spent }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="spent" stroke="#8884d8" name="Spent" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Projects Table */}
      {(topProjects || []).length > 0 && (
        <Card title="Top Projects by Budget" style={{ marginBottom: '24px' }}>
          <Table
            dataSource={topProjects || []}
            columns={topProjectsColumns}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Card>
      )}

      {/* Budget vs Expenditure Chart */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Budget vs Expenditure (Per Project)" style={{ height: '500px' }}>
            {(budgetVsExpenditure || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={budgetVsExpenditure || []}
                  margin={{ top: 40, right: 30, left: 20, bottom: 80 }}
                >
                  <Legend verticalAlign="top" height={36} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="project_name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 10000000) {
                        return (value / 10000000).toFixed(1) + 'Cr';
                      } else if (value >= 100000) {
                        return (value / 100000).toFixed(1) + 'L';
                      } else if (value >= 1000) {
                        return (value / 1000).toFixed(1) + 'K';
                      }
                      return value.toString();
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    labelStyle={{ color: '#333', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="budget" fill="#1890ff" name="Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenditure" fill="#52c41a" name="Expenditure" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">No budget vs expenditure data available</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Remaining Budget Chart */}
        <Col xs={24} lg={12}>
          <Card title="Remaining Budget by Project" style={{ height: '500px' }}>
            {(remainingBudget || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={remainingBudget || []}
                  margin={{ top: 40, right: 30, left: 20, bottom: 80 }}
                >
                  <Legend verticalAlign="top" height={36} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="project_name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 10000000) {
                        return (value / 10000000).toFixed(1) + 'Cr';
                      } else if (value >= 100000) {
                        return (value / 100000).toFixed(1) + 'L';
                      } else if (value >= 1000) {
                        return (value / 1000).toFixed(1) + 'K';
                      }
                      return value.toString();
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    labelStyle={{ color: '#333', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="remaining_budget" fill="#fa8c16" name="Remaining Budget" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">No remaining budget data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Funding Overview and Grant History */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Project Funding Overview - Agency-wise */}
        <Col xs={24} lg={12}>
          <Card title="Project Funding Overview (MEITY & DST)" style={{ height: '500px' }}>
            {(fundingOverview || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Legend verticalAlign="top" height={36} />
                  <Pie
                    data={fundingOverview || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ funding_agency, percent }) => `${funding_agency} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="total_value"
                    nameKey="funding_agency"
                  >
                    {(fundingOverview || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Total Value']}
                    labelFormatter={(label) => label}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">No funding overview data available</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Grant History Line Chart */}
        <Col xs={24} lg={12}>
          <Card title="Grant History Timeline" style={{ height: '500px' }}>
            {(grantHistory || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={grantHistory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 10000000) {
                        return (value / 10000000).toFixed(1) + 'Cr';
                      } else if (value >= 100000) {
                        return (value / 100000).toFixed(1) + 'L';
                      } else if (value >= 1000) {
                        return (value / 1000).toFixed(1) + 'K';
                      }
                      return value.toString();
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="amount_received" stroke="#eb2f96" name="Grant Amount" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">No grant history data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Funding Agencies Detail Table */}
      {fundingOverview.length > 0 && (
        <Card title="Funding Agencies Detail" style={{ marginBottom: '24px' }}>
          <Table
            dataSource={fundingOverview}
            columns={[
              {
                title: 'Funding Agency',
                dataIndex: 'funding_agency',
                key: 'funding_agency',
                render: (text) => <Text strong>{text}</Text>,
              },
              {
                title: 'Number of Projects',
                dataIndex: 'project_count',
                key: 'project_count',
                render: (value) => <Tag color="blue">{value}</Tag>,
                sorter: (a, b) => a.project_count - b.project_count,
              },
              {
                title: 'Total Value',
                dataIndex: 'total_value',
                key: 'total_value',
                render: (value) => formatCurrency(value),
                sorter: (a, b) => a.total_value - b.total_value,
              },
              {
                title: 'Average Project Value',
                key: 'average_value',
                render: (_, record) => formatCurrency(record.total_value / record.project_count),
                sorter: (a, b) => (a.total_value / a.project_count) - (b.total_value / b.project_count),
              },
            ]}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Card>
      )}

      {/* Grant History Details Table */}
      {grantHistory.length > 0 && (
        <Card title="Grant History Details" style={{ marginBottom: '24px' }}>
          <Table
            dataSource={grantHistory}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                render: (date) => new Date(date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
              },
              {
                title: 'Project Name',
                dataIndex: 'project_name',
                key: 'project_name',
                render: (text) => <Text strong>{text}</Text>,
                width: 250,
              },
              {
                title: 'Amount Received',
                dataIndex: 'amount_received',
                key: 'amount_received',
                render: (value) => (
                  <Text type="success" style={{ fontWeight: 'bold' }}>
                    {formatCurrency(value)}
                  </Text>
                ),
                sorter: (a, b) => a.amount_received - b.amount_received,
              },
              {
                title: 'Month',
                key: 'month',
                render: (_, record) => new Date(record.date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long' 
                }),
              },
            ]}
            pagination={{ pageSize: 15 }}
            scroll={{ x: true }}
          />
        </Card>
      )}
    </div>
  );
};

export default FinanceDashboardTab; 