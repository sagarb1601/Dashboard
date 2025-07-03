import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const { Title, Text } = Typography;

// Color palette for charts
const CHART_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#faad14'];

interface AdminSummary {
  total_staff: number;
  active_staff: number;
  total_contractors: number;
  active_contractors: number;
  total_vehicles: number;
  operational_vehicles: number;
  total_amc_contracts: number;
  active_amc_contracts: number;
}

interface StaffByDepartment {
  department_name: string;
  staff_count: number;
}

interface ContractorStatus {
  status: string;
  count: number;
}

interface VehicleStatus {
  status: string;
  count: number;
}

interface AMCStatus {
  status: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  staff_joined: number;
  contractors_added: number;
  vehicles_added: number;
}

const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AdminSummary>({
    total_staff: 0,
    active_staff: 0,
    total_contractors: 0,
    active_contractors: 0,
    total_vehicles: 0,
    operational_vehicles: 0,
    total_amc_contracts: 0,
    active_amc_contracts: 0
  });
  const [staffByDepartment, setStaffByDepartment] = useState<StaffByDepartment[]>([]);
  const [contractorStatus, setContractorStatus] = useState<ContractorStatus[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus[]>([]);
  const [amcStatus, setAmcStatus] = useState<AMCStatus[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin dashboard data...');
      
      // Fetch summary data
      const summaryRes = await fetch('/api/admin/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const summaryData = await summaryRes.json();
      console.log('Admin summary data:', summaryData);
      setSummary(summaryData);

      // Fetch staff by department
      const staffDeptRes = await fetch('/api/admin/dashboard/staff-by-department', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const staffDeptData = await staffDeptRes.json();
      console.log('Staff by department data:', staffDeptData);
      setStaffByDepartment(staffDeptData.map((d: any) => ({ ...d, staff_count: Number(d.staff_count) })));

      // Fetch contractor status
      const contractorStatusRes = await fetch('/api/admin/dashboard/contractor-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const contractorStatusData = await contractorStatusRes.json();
      console.log('Contractor status data:', contractorStatusData);
      setContractorStatus(contractorStatusData);

      // Fetch vehicle status
      const vehicleStatusRes = await fetch('/api/admin/dashboard/vehicle-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const vehicleStatusData = await vehicleStatusRes.json();
      console.log('Vehicle status data:', vehicleStatusData);
      setVehicleStatus(vehicleStatusData.map((d: any) => ({ ...d, count: Number(d.count) })));

      // Fetch AMC status
      const amcStatusRes = await fetch('/api/admin/dashboard/amc-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const amcStatusData = await amcStatusRes.json();
      console.log('AMC status data:', amcStatusData);
      setAmcStatus(amcStatusData);

      // Fetch monthly trends
      const monthlyTrendsRes = await fetch('/api/admin/dashboard/monthly-trends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const monthlyTrendsData = await monthlyTrendsRes.json();
      console.log('Monthly trends data:', monthlyTrendsData);
      setMonthlyTrends(monthlyTrendsData);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          {data.department_name && (
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.department_name}</p>
          )}
          {data.status && (
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.status}</p>
          )}
          <p style={{ margin: '0', color: '#666' }}>
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '24px' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '16px', marginBottom: '16px' }}>Loading admin dashboard data...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Please wait while we fetch the latest information</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Staff"
                  value={summary.total_staff}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div style={{ marginTop: '8px', color: '#1890ff', fontSize: '12px' }}>
                  👥 Active: {summary.active_staff}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Contractors"
                  value={summary.total_contractors}
                  valueStyle={{ color: '#52c41a' }}
                />
                <div style={{ marginTop: '8px', color: '#52c41a', fontSize: '12px' }}>
                  🏢 Active: {summary.active_contractors}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Vehicles"
                  value={summary.total_vehicles}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <div style={{ marginTop: '8px', color: '#fa8c16', fontSize: '12px' }}>
                  🚗 Operational: {summary.operational_vehicles}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="AMC Contracts"
                  value={summary.total_amc_contracts}
                  valueStyle={{ color: '#722ed1' }}
                />
                <div style={{ marginTop: '8px', color: '#722ed1', fontSize: '12px' }}>
                  📋 Active: {summary.active_amc_contracts}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Charts Section */}
          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            {/* Staff by Department */}
            <Col xs={24} lg={12}>
              <Card title="Staff Distribution by Department" style={{ height: '400px' }}>
                {staffByDepartment.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={staffByDepartment}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ department_name, staff_count, percent }) => 
                          `${department_name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="staff_count"
                      >
                        {staffByDepartment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">No staff data available</Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Contractor Status */}
            <Col xs={24} lg={12}>
              <Card title="Contractor Status Distribution" style={{ height: '400px' }}>
                {contractorStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contractorStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#52c41a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">No contractor data available</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            {/* Vehicle Status */}
            <Col xs={24} lg={12}>
              <Card title="Vehicle Status Overview" style={{ height: '400px' }}>
                {vehicleStatus.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={vehicleStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {vehicleStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                      <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                        OPERATIONAL: {vehicleStatus[0]?.count || 0}
                      </Text>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">No vehicle data available</Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* AMC Status */}
            <Col xs={24} lg={12}>
              <Card title="AMC Contract Status" style={{ height: '400px' }}>
                {amcStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={amcStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#722ed1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">No AMC data available</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Monthly Trends */}
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card title="Monthly Trends - New Additions" style={{ height: '400px' }}>
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="staff_joined" 
                        stroke="#1890ff" 
                        name="Staff Joined"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="contractors_added" 
                        stroke="#52c41a" 
                        name="Contractors Added"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="vehicles_added" 
                        stroke="#fa8c16" 
                        name="Vehicles Added"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">No trend data available</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default AdminDashboard; 