import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Paper } from '@mui/material';

interface Staff {
  staff_id: number;
  name: string;
  department_id: number;
  joining_date: string;
  date_of_leaving: string | null;
  status: string;
  gender: string;
  department_name: string;
  last_salary_date: string;
  current_salary: string;
}

interface DepartmentData {
  department: string;
  activeStaff: number;
}

const ActiveStaffChart = () => {
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [chartData, setChartData] = useState<DepartmentData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/staff', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setStaffData(data);
      } catch (error) {
        console.error('Failed to fetch staff data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const departmentMap = new Map<string, number>();

    staffData.forEach((staff) => {
      if (staff.status === 'ACTIVE') {
        departmentMap.set(
          staff.department_name,
          (departmentMap.get(staff.department_name) || 0) + 1
        );
      }
    });

    const formattedChartData: DepartmentData[] = Array.from(departmentMap.entries()).map(
      ([department, activeStaff]) => ({ department, activeStaff })
    );

    setChartData(formattedChartData);
  }, [staffData]);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2, height: 500 }}>
      <h2>Number of Active Staff vs Department</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="activeStaff" fill="#8884d8" name="Active Staff" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default ActiveStaffChart;
