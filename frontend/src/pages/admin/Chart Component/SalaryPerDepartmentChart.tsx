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

interface Salary {
  salary_id: number;
  staff_id: number;
  net_salary: string;
  payment_date: string;
  status: string;
  created_at: string;
}

interface SalaryData {
  department: string;
  Paid: number;
  Pending: number;
}

const SalaryPerDepartmentChart = () => {
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [salaryData, setSalaryData] = useState<Salary[]>([]);
  const [chartData, setChartData] = useState<SalaryData[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
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

    const fetchSalaries = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/staff/salaries', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setSalaryData(data);
      } catch (error) {
        console.error('Failed to fetch salary data:', error);
      }
    };

    fetchStaff();
    fetchSalaries();
  }, []);

  useEffect(() => {
    const staffMap = new Map<number, string>();
    staffData.forEach((staff) => {
      staffMap.set(staff.staff_id, staff.department_name);
    });

    const departmentMap = new Map<string, { Paid: number; Pending: number }>();

    salaryData.forEach((salary) => {
      const department = staffMap.get(salary.staff_id);
      if (!department) return;

      const net = parseFloat(salary.net_salary);
      const current = departmentMap.get(department) || { Paid: 0, Pending: 0 };

      if (salary.status === 'PAID') {
        current.Paid += net;
      } else if (salary.status === 'PENDING') {
        current.Pending += net;
      }

      departmentMap.set(department, current);
    });

    const formattedChartData: SalaryData[] = Array.from(departmentMap.entries()).map(
      ([department, { Paid, Pending }]) => ({ department, Paid, Pending })
    );

    setChartData(formattedChartData);
  }, [salaryData, staffData]);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2, height: 500 }}>
      <h2>Salaries per Department (Paid vs Pending)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis />
          <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="Paid" fill="#82ca9d" name="Paid Salary" />
          <Bar dataKey="Pending" fill="#f4a261" name="Pending Salary" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default SalaryPerDepartmentChart;
