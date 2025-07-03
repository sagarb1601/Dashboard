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
import api from '../../utils/api';

const { Title, Text } = Typography;

// Chart colors
const CHART_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#faad14'];

interface FinancialSummary {
  total_projects: number;
  total_value: number;
  current_year_spent: number;
  current_year_budget: number;
  current_year_pending: number;
}

interface GroupProject {
  group_name: string;
  project_count: number;
  total_budget: number;
  total_spent: number;
  pending_amount: number;
}

interface ProjectStatus {
  status: string;
  count: number;
  value: number;
}

interface MonthlyTrend {
  month: number;
  month_name: string;
  spent: number;
}

interface TopProject {
  project_name: string;
  total_budget: number;
  total_spent: number;
  pending_amount: number;
  status: string;
  group_name: string;
  end_date: string;
  extension_end_date: string;
}

interface BudgetVsExpenditure {
  project_name: string;
  budget: number;
  expenditure: number;
}

interface RemainingBudget {
  project_name: string;
  remaining_budget: number;
  total_budget: number;
  total_expenditure: number;
}

interface FundingOverview {
  funding_agency: string;
  project_count: number;
  total_value: number;
  total_expenditure: number;
  remaining_budget: number;
}

interface GrantHistory {
  date: string;
  project_name: string;
  amount_received: number;
}

interface FYBudgetRemaining {
  project_name: string;
  total_project_budget: number;
  fy_budget_allocated: number;
  fy_expenditure: number;
  fy_budget_remaining: number;
  utilization_status: string;
  utilization_percentage: number;
}

interface ExpenditureSummary {
  project_id: number;
  project_name: string;
  total_budget: number;
  total_expenditure: number;
  remaining_budget: number;
  utilization_percentage: number;
  status: string;
  group_name: string;
  start_date: string;
  end_date: string;
}

interface ProjectExpenditureDetail {
  expenditure_id: number;
  project_name: string;
  expenditure_date: string;
  amount: number;
  description: string;
  category: string;
  vendor: string;
  payment_status: string;
  invoice_number: string;
}

const FinanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [groupProjects, setGroupProjects] = useState<GroupProject[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [topProjects, setTopProjects] = useState<TopProject[]>([]);
  const [budgetVsExpenditure, setBudgetVsExpenditure] = useState<BudgetVsExpenditure[]>([]);
  const [remainingBudget, setRemainingBudget] = useState<RemainingBudget[]>([]);
  const [fundingOverview, setFundingOverview] = useState<FundingOverview[]>([]);
  const [grantHistory, setGrantHistory] = useState<GrantHistory[]>([]);
  const [fyBudgetRemaining, setFyBudgetRemaining] = useState<FYBudgetRemaining[]>([]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<number>(new Date().getFullYear());
  const [expenditureSummary, setExpenditureSummary] = useState<ExpenditureSummary[]>([]);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectForExpenditure, setSelectedProjectForExpenditure] = useState<any | null>(null);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [expenditureLoading, setExpenditureLoading] = useState(false);
  const [budgetFields, setBudgetFields] = useState<any[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<any[]>([]);

  // Helper functions - defined before they are used
  const getFinancialYearEnd = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month >= 4 ? year + 1 : year;
  };

  const getExpenditureYear = (exp: any) => getFinancialYearEnd(new Date(exp.expenditure_date));

  const getExpenditureYears = (): number[] => {
    if (!expenditures.length) return [];
    const years = new Set(expenditures.map(getExpenditureYear));
    return Array.from(years).sort();
  };

  const getBudgetYears = (): number[] => {
    if (!budgetEntries.length) return [];
    const years = new Set<number>();
    budgetEntries.forEach(entry => years.add(entry.year_number));
    return Array.from(years).sort();
  };

  const getBudgetAmount = (fieldId: number, yearNumber: number): number => {
    const budgetEntry = budgetEntries.find(entry =>
        entry.field_id === fieldId && entry.year_number === yearNumber
    );
    const amount = Number(budgetEntry?.amount) || 0;
    if (isNaN(amount)) {
        return 0;
    }
    return amount;
  };

  const getFieldTotalBudget = (fieldId: number): number => {
      const total = budgetEntries
          .filter(entry => entry.field_id === fieldId)
          .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getLatestGrantReceived = (fieldId: number): number => {
      const field = budgetFields.find(f => f.field_id === fieldId);
      console.log('getLatestGrantReceived - fieldId:', fieldId, 'field:', field);
      const amount = Number(field?.total_grant_received || field?.latest_grant_received || field?.grant_received || 0);
      console.log('getLatestGrantReceived - amount:', amount);
      if (isNaN(amount)) {
          return 0;
      }
      return amount;
  };

  const getExpenditureAmount = (fieldId: number, year: number): number => {
      console.log('getExpenditureAmount - fieldId:', fieldId, 'year:', year, 'expenditures:', expenditures);
      const total = expenditures
          .filter(exp => exp.field_id === fieldId && getExpenditureYear(exp) === year)
          .reduce((sum, exp) => sum + (Number(exp.amount_spent) || 0), 0);
      console.log('getExpenditureAmount - total:', total);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getTotalExpenditure = (fieldId: number): number => {
      console.log('getTotalExpenditure - fieldId:', fieldId, 'expenditures:', expenditures);
      const total = expenditures
          .filter(exp => exp.field_id === fieldId)
          .reduce((sum, exp) => sum + (Number(exp.amount_spent) || 0), 0);
      console.log('getTotalExpenditure - total:', total);
      if (isNaN(total)) {
          return 0;
      }
      return total;
  };

  const getBalance = (fieldId: number): number => {
      const grantReceived = getLatestGrantReceived(fieldId);
      const totalExpenditure = getTotalExpenditure(fieldId);
      const balance = grantReceived - totalExpenditure;
      console.log('getBalance - fieldId:', fieldId, 'grantReceived:', grantReceived, 'totalExpenditure:', totalExpenditure, 'balance:', balance);
      if (isNaN(balance)) {
          return 0;
      }
      return balance;
  };

  const getYearTotalBudget = (year: number): number => {
    const total = budgetFields.reduce((sum, field) => sum + getBudgetAmount(field.field_id, year), 0);
    if (isNaN(total)) {
        return 0;
    }
    return total;
  };

  const getYearTotalExpenditure = (year: number): number => {
    const total = budgetFields.reduce((sum, field) => sum + getExpenditureAmount(field.field_id, year), 0);
    if (isNaN(total)) {
        return 0;
    }
    return total;
  };

  const getGrandTotalBudget = () => {
    const total = budgetFields.reduce((acc, field) => acc + getFieldTotalBudget(field.field_id), 0);
    return isNaN(total) ? 0 : total;
  };

  const getGrandTotalGrantReceived = () => {
    const total = budgetFields.reduce((acc, field) => acc + getLatestGrantReceived(field.field_id), 0);
    return isNaN(total) ? 0 : total;
  };

  const getGrandTotalExpenditure = () => {
    const total = budgetFields.reduce((acc, field) => acc + getTotalExpenditure(field.field_id), 0);
    return isNaN(total) ? 0 : total;
  };

  const getGrandTotalBalance = () => {
    const total = budgetFields.reduce((acc, field) => acc + getBalance(field.field_id), 0);
    return isNaN(total) ? 0 : total;
  };

  const getOrdinalSuffix = (num: number): string => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  };

  const formatYearAsOrdinal = (year: number): string => {
    return `${year}${getOrdinalSuffix(year)} Year`;
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
        grantHistoryRes,
        fyBudgetRemainingRes
      ] = await Promise.all([
        api.get('/finance/dashboard/summary'),
        api.get('/finance/dashboard/group-projects'),
        api.get('/finance/dashboard/project-status'),
        api.get('/finance/dashboard/monthly-trend'),
        api.get('/finance/dashboard/top-projects'),
        api.get('/finance/dashboard/budget-vs-expenditure'),
        api.get('/finance/dashboard/remaining-budget'),
        api.get('/finance/dashboard/funding-overview'),
        api.get('/finance/dashboard/grant-history'),
        api.get(`/finance/dashboard/fy-budget-remaining?year=${selectedFinancialYear}`)
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
      setFyBudgetRemaining(fyBudgetRemainingRes.data);

      // Create expenditure summary from existing budget vs expenditure data
      if (budgetVsExpenditureRes.data && budgetVsExpenditureRes.data.length > 0) {
        const expenditureData = budgetVsExpenditureRes.data.map((item: any) => ({
          project_id: item.project_id || Math.random(), // Generate ID if not available
          project_name: item.project_name,
          total_budget: item.budget,
          total_expenditure: item.expenditure,
          remaining_budget: item.budget - item.expenditure,
          utilization_percentage: item.budget > 0 ? (item.expenditure / item.budget) * 100 : 0,
          status: 'Ongoing', // Default status
          group_name: 'Technical', // Default group
          start_date: 'N/A', // Default start date
          end_date: 'N/A' // Default end date
        }));
        setExpenditureSummary(expenditureData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedFinancialYear]);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      const response = await api.get('/finance/projects');
      console.log('Projects response:', response.data);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchProjects();
  }, [fetchDashboardData]);

  const fetchFYBudgetData = useCallback(async () => {
    try {
      console.log(`Fetching FY budget data for year: ${selectedFinancialYear}`);
      const response = await api.get(`/finance/dashboard/fy-budget-remaining?year=${selectedFinancialYear}`);
      console.log('Raw query results:', response.data.raw_query_results);
      if (response.data.processed_data) {
        console.log('Processed data:', response.data.processed_data);
      } else {
        console.log('No processed data received.');
      }
      setFyBudgetRemaining(response.data.fy_budget_data);
      console.log('Available budget years in database:', response.data.available_years);
      console.log('Total projects in database:', response.data.total_projects_in_db);
      console.log(`Budget entries for year ${selectedFinancialYear}:`, response.data.budget_entries_for_year);
      console.log(`Query returned ${response.data.projects_count_for_year} projects for year ${selectedFinancialYear}`);
      console.log('Sample data:', response.data.sample_data);
      if (response.data.message) {
        console.log(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching FY budget data:', error);
    }
  }, [selectedFinancialYear]);

  // Refetch FY budget data when year changes
  useEffect(() => {
    if (!loading) {
      fetchFYBudgetData();
    }
  }, [selectedFinancialYear, loading, fetchFYBudgetData]);

  // Debug expenditure summary state
  useEffect(() => {
    console.log('expenditureSummary state changed:', expenditureSummary);
    console.log('showProjectDetails:', showProjectDetails);
  }, [expenditureSummary, showProjectDetails]);

  const fetchProjectExpenditureDetails = async (projectId: number) => {
    try {
      // For now, create mock detailed data since we don't have individual expenditure entries
      const project = expenditureSummary.find(p => p.project_id === projectId);
      if (project) {
        const mockDetails = [
          {
            expenditure_id: 1,
            project_name: project.project_name,
            expenditure_date: new Date().toISOString().split('T')[0],
            amount: project.total_expenditure,
            description: `Total expenditure for ${project.project_name}`,
            category: 'Project Expenditure',
            vendor: 'Various',
            payment_status: 'Completed',
            invoice_number: 'N/A'
          }
        ];
        setBudgetFields(mockDetails);
        setSelectedProjectForExpenditure(project);
        setShowProjectDetails(true);
      }
    } catch (error) {
      console.error('Error fetching project expenditure details:', error);
    }
  };

  const fetchBudgetFields = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/projects/${projectId}/budget-fields-with-grants`);
      console.log('Budget fields response:', response.data);
      setBudgetFields(response.data);
    } catch (error) {
      console.error('Error fetching budget fields:', error);
    }
  };

  const handleProjectChange = (value: number) => {
    const project = projects.find(p => p.project_id === value);
    setSelectedProjectForExpenditure(project);
    if (project) {
      fetchExpenditures(project.project_id);
      fetchBudgetFields(project.project_id);
      fetchBudgetEntries(project.project_id);
    } else {
      setExpenditures([]);
      setBudgetFields([]);
      setBudgetEntries([]);
    }
  };

  const fetchExpenditures = async (projectId: number) => {
    try {
      setExpenditureLoading(true);
      const response = await api.get(`/finance/projects/${projectId}/expenditures`);
      console.log('Expenditures response:', response.data);
      setExpenditures(response.data);
    } catch (error) {
      console.error('Error fetching expenditures:', error);
    } finally {
      setExpenditureLoading(false);
    }
  };

  const fetchBudgetEntries = async (projectId: number) => {
    try {
      const response = await api.get(`/finance/projects/${projectId}/budget-entries`);
      console.log('Budget entries response:', response.data);
      setBudgetEntries(response.data);
    } catch (error) {
      console.error('Error fetching budget entries:', error);
    }
  };

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

  const pieChartData = (projectStatus || []).map(item => ({ name: item.status, value: item.count }));
  const groupBarChartData = (groupProjects || []).map(item => ({ name: item.group_name, Budget: item.total_budget, Spent: item.total_spent }));

  // Debug logging
  console.log('FinanceDashboard render state:', {
    budgetFields,
    expenditures,
    budgetEntries,
    selectedProjectForExpenditure,
    expenditureLoading
  });

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

  const fyBudgetRemainingData = (fyBudgetRemaining || []).map(item => ({
    key: item.project_name,
    ...item
  }));

  const budgetYears = getBudgetYears();
  const expenditureYears = getExpenditureYears();

  const columns = [
      {
          title: 'Particulars',
          dataIndex: 'field_name',
          key: 'field_name',
          fixed: 'left' as const,
          width: 200,
      },
      {
          title: 'Budget (₹)',
          children: [
              ...(budgetYears || []).map((year, idx) => ({
                  title: `${idx + 1} Yr (₹)`,
                  key: `year${year}_budget`,
                  render: (_: any, record: any) => {
                      const yearBudget = getBudgetAmount(record.field_id, year);
                      return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(yearBudget)}</div>;
                  },
                  width: 140,
              })),
              {
                  title: 'Total (₹)',
                  key: 'total_budget',
                  render: (_: any, record: any) => {
                      const totalBudget = getFieldTotalBudget(record.field_id);
                      return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(totalBudget)}</div>;
                  },
                  width: 160,
              },
          ],
      },
      {
          title: 'Grant Received (₹)',
          dataIndex: 'grant_received',
          key: 'grant_received',
          render: (text: any, record: any) => {
              const grantReceived = getLatestGrantReceived(record.field_id);
              return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(grantReceived)}</div>;
          },
          width: 160,
      },
      {
          title: 'Expenditure (₹)',
          children: [
              ...(expenditureYears || []).map(year => {
                  const shortYear = year.toString().slice(-2);
                  return {
                      title: `31 Mar ${shortYear} (₹)`,
                      dataIndex: `expenditure_${year}`,
                      key: `expenditure_${year}`,
                      render: (text: any, record: any) => {
                          const expenditure = getExpenditureAmount(record.field_id, year);
                          return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(expenditure)}</div>;
                      },
                      width: 160,
                  };
              }),
              {
                  title: 'Total (₹)',
                  dataIndex: 'total_expenditure',
                  key: 'total_expenditure',
                  render: (text: any, record: any) => {
                      const totalExpenditure = getTotalExpenditure(record.field_id);
                      return <div style={{ whiteSpace: 'nowrap' }}>{formatCurrency(totalExpenditure)}</div>;
                  },
                  width: 160,
              },
          ],
      },
      {
          title: 'Balance (₹)',
          key: 'balance',
          render: (text: any, record: any) => {
              const balance = getBalance(record.field_id);
              return <div style={{ whiteSpace: 'nowrap', color: balance < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(balance)}</div>;
          },
          width: 160,
      }
  ];

  const expenditureSummaryColumns = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string, record: ExpenditureSummary) => (
        <button 
          type="button"
          style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          onClick={() => {
            console.log(`Clicked project: ${record.project_name} (ID: ${record.project_id})`);
          }}
        >
          {text}
        </button>
      )
    },
  ];

  // Custom tooltip component for grant history
  const CustomGrantTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ color: '#333', fontWeight: 'bold', margin: '0 0 4px 0' }}>
            {data.project_name}
          </p>
          <p style={{ color: '#666', margin: '0 0 4px 0' }}>
            Date: {label}
          </p>
          <p style={{ color: '#722ed1', fontWeight: 'bold', margin: '0' }}>
            Amount: {formatCurrency(data.amount)}
          </p>
        </div>
      );
    }
    return null;
  };

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
        {/* Commented out for now
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Year Spent"
              value={summary?.current_year_spent || 0}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: '8px', color: '#fa8c16', fontSize: '12px' }}>
              📈 Spent
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Year Pending"
              value={summary?.current_year_pending || 0}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#f5222d' }}
            />
            <div style={{ marginTop: '8px', color: '#f5222d', fontSize: '12px' }}>
              ⏳ Pending
            </div>
          </Card>
        </Col>
        */}
      </Row>

      {/* Project Status Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Statistic
              title="Completed Projects"
              value={projectStatus.find(s => s.status === 'Completed')?.count || 0}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: '8px', color: '#52c41a', fontSize: '12px' }}>
              ✅ Completed
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Statistic
              title="Ongoing Projects"
              value={projectStatus.find(s => s.status === 'Ongoing')?.count || 0}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '8px', color: '#1890ff', fontSize: '12px' }}>
              🔄 Ongoing
            </div>
          </Card>
        </Col>
      </Row>

      {/* Project Status and Group Projects */}
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

      {/* Monthly Trends Cards */}
      {(monthlyTrend || []).length > 0 && (
        <Card title="Monthly Spending Trends" style={{ marginBottom: '24px' }}>
          <Row gutter={[8, 8]}>
            {(monthlyTrend || []).map((trend) => (
              <Col xs={12} sm={8} md={6} lg={4} key={trend.month}>
                <Card size="small">
                  <Statistic
                    title={trend.month_name}
                    value={trend.spent}
                    formatter={(value) => formatCurrency(value as number)}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* New Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Budget vs Expenditure Grouped Bar Chart */}
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

        {/* Remaining Budget Vertical Bar Chart */}
        <Col xs={24} lg={12}>
          <Card title="Remaining Budget (Per Project)" style={{ height: '500px' }}>
            {(remainingBudget || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={remainingBudget || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="project_name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 11 }}
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
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Remaining Budget']}
                    labelStyle={{ color: '#333', fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="remaining_budget" 
                    fill="#fa8c16" 
                    name="Remaining Budget"
                    radius={[4, 4, 0, 0]}
                  />
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
          <Card title="Grant History Over Time" style={{ height: '500px' }}>
            {(grantHistory || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={(grantHistory || []).map(item => ({ 
                  date: new Date(item.date).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }), 
                  amount: item.amount_received,
                  project_name: item.project_name
                }))}>
                  <Legend verticalAlign="top" height={36} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
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
                  <Tooltip content={<CustomGrantTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#722ed1" 
                    strokeWidth={2}
                    name="Amount Received"
                    dot={{ fill: '#722ed1', strokeWidth: 2, r: 4 }}
                  />
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
              },
              {
                title: 'Percentage of Total',
                key: 'percentage',
                render: (_, record) => {
                  const totalValue = fundingOverview.reduce((sum, item) => sum + item.total_value, 0);
                  const percentage = (record.total_value / totalValue) * 100;
                  return (
                    <Progress
                      percent={Math.round(percentage)}
                      size="small"
                      status={percentage > 30 ? 'active' : 'normal'}
                    />
                  );
                },
              },
            ]}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Card>
      )}

      {/* Grant History Detail Table */}
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

      {/* Expenditure Tracking */}
      <Card 
        title="Budget and Expenditure Summary" 
        style={{ marginBottom: '24px' }}
        extra={
          <Text type="secondary">
            Select a project to view detailed budget vs expenditure breakdown
          </Text>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <Select
            placeholder="Select a project"
            style={{ width: 400 }}
            onChange={(value) => handleProjectChange(value)}
            allowClear
          >
            {(projects || []).map(project => (
              <Select.Option key={project.project_id} value={project.project_id}>
                {project.project_name}
              </Select.Option>
            ))}
          </Select>
        </div>

        {selectedProjectForExpenditure && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Selected Project: {selectedProjectForExpenditure.project_name}</Text>
          </div>
        )}

        {expenditureLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Loading budget and expenditure data...</Text>
            </div>
          </div>
        ) : selectedProjectForExpenditure && budgetFields.length > 0 && expenditures.length >= 0 && budgetEntries.length >= 0 ? (
          <div>
          <Table
              dataSource={budgetFields}
              columns={columns}
              pagination={false}
              scroll={{ x: 1500 }}
            size="small"
              summary={(pageData) => {
                console.log('Summary row calculation - pageData:', pageData);
                console.log('Summary row calculation - budgetFields:', budgetFields);
                console.log('Summary row calculation - expenditures:', expenditures);
                console.log('Summary row calculation - budgetEntries:', budgetEntries);
                
                const totalYearBudgets = (budgetYears || []).map(year => 
                  pageData.reduce((sum, record) => sum + getBudgetAmount(record.field_id, year), 0)
                );
                const grandTotalBudget = pageData.reduce((sum, record) => sum + getFieldTotalBudget(record.field_id), 0);
                const grandTotalGrant = pageData.reduce((sum, record) => sum + getLatestGrantReceived(record.field_id), 0);
                const totalYearExpenditures = (expenditureYears || []).map(year => 
                  pageData.reduce((sum, record) => sum + getExpenditureAmount(record.field_id, year), 0)
                );
                const grandTotalExp = pageData.reduce((sum, record) => sum + getTotalExpenditure(record.field_id), 0);
                const grandTotalBalance = pageData.reduce((sum, record) => sum + getBalance(record.field_id), 0);
                
                console.log('Summary row totals:', {
                  totalYearBudgets,
                  grandTotalBudget,
                  grandTotalGrant,
                  totalYearExpenditures,
                  grandTotalExp,
                  grandTotalBalance
                });
                
                let currentIndex = 0;
                
                return (
                  <Table.Summary.Row style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={currentIndex++}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    
                    {totalYearBudgets.map((total) => (
                      <Table.Summary.Cell key={`budget-total-${currentIndex}`} index={currentIndex++}>
                        <Text strong style={{ color: total < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(total)}</Text>
                      </Table.Summary.Cell>
                    ))}
                    
                    <Table.Summary.Cell index={currentIndex++}>
                      <Text strong style={{ color: grandTotalBudget < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(grandTotalBudget)}</Text>
                    </Table.Summary.Cell>
                    
                    <Table.Summary.Cell index={currentIndex++}>
                      <Text strong style={{ color: grandTotalGrant < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(grandTotalGrant)}</Text>
                    </Table.Summary.Cell>

                    {totalYearExpenditures.map((total) => (
                      <Table.Summary.Cell key={`exp-total-${currentIndex}`} index={currentIndex++}>
                        <Text strong style={{ color: total < 0 ? '#ff4d4f' : 'inherit' }}>
                          {formatCurrency(total)}
                        </Text>
                      </Table.Summary.Cell>
                    ))}

                    <Table.Summary.Cell index={currentIndex++}>
                      <Text strong style={{ color: grandTotalExp < 0 ? '#ff4d4f' : 'inherit' }}>{formatCurrency(grandTotalExp)}</Text>
                    </Table.Summary.Cell>

                    <Table.Summary.Cell index={currentIndex++}>
                      <Text strong style={{ color: grandTotalBalance < 0 ? '#ff4d4f' : 'inherit' }}>
                        {formatCurrency(grandTotalBalance)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </div>
        ) : selectedProjectForExpenditure ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Text type="secondary">No budget and expenditure data found for this project</Text>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Text type="secondary">Please select a project to view budget and expenditure summary</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FinanceDashboard; 
