import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Project {
  project_id: number;
  project_name: string;
  start_date: string;
  end_date: string;
  extension_end_date: string | null;
  total_value: number;
  funding_agency: string;
  duration_years: number;
  created_at: string;
}

interface ChartData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9C27B0', '#FF5252'];

const FinanceHome = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [data, setData] = useState<ChartData[]>([]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/finance/projects/group-by-funding-agency', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const json = await response.json();
        setProjects(json);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const grouped = projects.reduce((acc: Record<string, number>, project) => {
      const agency = project.funding_agency;
      if (!acc[agency]) acc[agency] = 0;
      acc[agency] += project.total_value;
      return acc;
    }, {});

    const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }));
    setData(chartData);
  }, [projects]);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Total Project Value by Funding Agency
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={130}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default FinanceHome;
