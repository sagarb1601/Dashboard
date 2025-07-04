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

interface HRSummary {
  total_employees: number;
  active_employees: number;
  new_hires_this_year: number;
  attrition_rate: number;
}

interface DepartmentDistribution {
  department: string;
  employee_count: number;
}

interface EmployeeGrowth {
  month: string;
  employee_count: number;
}

interface TrainingSummary {
  total_trainings: number;
  trainings_this_year: number;
  total_participants: number;
  avg_participants_per_training: number;
}

interface TrainingByType {
  training_type: string;
  training_count: number;
  total_participants: number;
}

interface RecruitmentSummary {
  total_recruitments: number;
  recruitments_this_year: number;
  total_recruited: number;
  recruited_this_year: number;
}

interface RecruitmentByMode {
  recruitment_mode: string;
  recruitment_count: number;
  total_recruited: number;
}

const HRDashboard: React.FC = () => {
  const [summary, setSummary] = useState<HRSummary>({
    total_employees: 0,
    active_employees: 0,
    new_hires_this_year: 0,
    attrition_rate: 0
  });
  const [departmentDistribution, setDepartmentDistribution] = useState<DepartmentDistribution[]>([]);
  const [employeeGrowth, setEmployeeGrowth] = useState<EmployeeGrowth[]>([]);
  const [trainingSummary, setTrainingSummary] = useState<TrainingSummary>({
    total_trainings: 0,
    trainings_this_year: 0,
    total_participants: 0,
    avg_participants_per_training: 0
  });
  const [trainingByType, setTrainingByType] = useState<TrainingByType[]>([]);
  const [recruitmentSummary, setRecruitmentSummary] = useState<RecruitmentSummary>({
    total_recruitments: 0,
    recruitments_this_year: 0,
    total_recruited: 0,
    recruited_this_year: 0
  });
  const [recruitmentByMode, setRecruitmentByMode] = useState<RecruitmentByMode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      console.log('Fetching HR dashboard data...');
      
      // Fetch HR summary
      const summaryRes = await fetch('/api/hr/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const summaryData = await summaryRes.json();
      console.log('HR summary data:', summaryData);
      setSummary(summaryData);

      // Fetch department distribution
      const deptRes = await fetch('/api/hr/dashboard/department-distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const deptData = await deptRes.json();
      console.log('Department distribution data:', deptData);
      setDepartmentDistribution(deptData);

      // Fetch employee growth
      const growthRes = await fetch('/api/hr/dashboard/employee-growth', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const growthData = await growthRes.json();
      console.log('Employee growth data:', growthData);
      setEmployeeGrowth(growthData);

      // Fetch training summary
      const trainingSummaryRes = await fetch('/api/hr/dashboard/training-summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const trainingSummaryData = await trainingSummaryRes.json();
      console.log('Training summary data:', trainingSummaryData);
      setTrainingSummary(trainingSummaryData);

      // Fetch training by type
      const trainingTypeRes = await fetch('/api/hr/dashboard/training-by-type', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const trainingTypeData = await trainingTypeRes.json();
      console.log('Training by type data:', trainingTypeData);
      setTrainingByType(trainingTypeData);

      // Fetch recruitment summary
      const recruitmentSummaryRes = await fetch('/api/hr/dashboard/recruitment-summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const recruitmentSummaryData = await recruitmentSummaryRes.json();
      console.log('Recruitment summary data:', recruitmentSummaryData);
      setRecruitmentSummary(recruitmentSummaryData);

      // Fetch recruitment by mode
      const recruitmentModeRes = await fetch('/api/hr/dashboard/recruitment-by-mode', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const recruitmentModeData = await recruitmentModeRes.json();
      console.log('Recruitment by mode data:', recruitmentModeData);
      setRecruitmentByMode(recruitmentModeData);

    } catch (error) {
      console.error('Error fetching HR data:', error);
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading HR dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Employee Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={summary.total_employees}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Employees"
              value={summary.active_employees}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="New Hires (This Year)"
              value={summary.new_hires_this_year}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Attrition Rate"
              value={summary.attrition_rate}
              suffix="%"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Training Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Trainings"
              value={trainingSummary.total_trainings}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Trainings (This Year)"
              value={trainingSummary.trainings_this_year}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Participants"
              value={trainingSummary.total_participants}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Participants/Training"
              value={trainingSummary.avg_participants_per_training}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recruitment Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Recruitments"
              value={recruitmentSummary.total_recruitments}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Recruitments (This Year)"
              value={recruitmentSummary.recruitments_this_year}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Recruited"
              value={recruitmentSummary.total_recruited}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Recruited (This Year)"
              value={recruitmentSummary.recruited_this_year}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Department Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Employee Distribution by Department" style={{ height: '400px' }}>
            {departmentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="employee_count" fill="#1890ff" name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No department data available" />
            )}
          </Card>
        </Col>

        {/* Employee Growth Trend */}
        <Col xs={24} lg={12}>
          <Card title="Employee Growth Trend" style={{ height: '400px' }}>
            {employeeGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={employeeGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="employee_count" 
                    stroke="#52c41a" 
                    name="Employee Count"
                    strokeWidth={3}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No growth data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Training and Recruitment Charts */}
      <Row gutter={[24, 24]}>
        {/* Training by Type */}
        <Col xs={24} lg={12}>
          <Card title="Training Distribution by Type" style={{ height: '400px' }}>
            {trainingByType.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={trainingByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="training_count"
                    >
                      {trainingByType.map((entry, index) => (
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
                                {data.training_type}
                              </p>
                              <p style={{ margin: '0', color: '#666' }}>
                                Trainings: {data.training_count}
                              </p>
                              <p style={{ margin: '0', color: '#666' }}>
                                Participants: {data.total_participants}
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
                  {trainingByType.map((entry, index) => (
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
                        {entry.training_type}: {entry.training_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="No training data available" />
            )}
          </Card>
        </Col>

        {/* Recruitment by Mode */}
        <Col xs={24} lg={12}>
          <Card title="Recruitment by Mode" style={{ height: '400px' }}>
            {recruitmentByMode.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recruitmentByMode}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="recruitment_mode" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_recruited" fill="#722ed1" name="Recruited" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No recruitment data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HRDashboard; 