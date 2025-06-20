import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Box, Typography, Paper, MenuItem, Select } from "@mui/material";

interface Project {
  project_id: number;
  project_name: string;
}

interface GrantEntry {
  grant_id: number;
  field_id: number;
  field_name: string;
  amount: string;
  received_date: string;
}

interface GrantDataItem {
  date: string;
  Total: number;
  [fieldName: string]: number | string;
}

const GrantHistoryChart = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [grantEntries, setGrantEntries] = useState<GrantEntry[]>([]);
  const [chartData, setChartData] = useState<GrantDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/finance/projects', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError('Failed to fetch projects');
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchGrantEntries = async () => {
      if (!selectedProject) return;
      try {
        const res = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/grant-entries`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data: GrantEntry[] = await res.json();
        setGrantEntries(data);
      } catch (err) {
        setError('Failed to fetch grant data');
      }
    };
    fetchGrantEntries();
  }, [selectedProject]);

  useEffect(() => {
    if (grantEntries.length === 0) return;

    const grouped: { [date: string]: GrantDataItem } = {};

    grantEntries.forEach((entry) => {
      const date = new Date(entry.received_date).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, Total: 0 };
      }

      const amount = parseFloat(entry.amount);
      grouped[date][entry.field_name] = (grouped[date][entry.field_name] as number || 0) + amount;
      grouped[date]['Total'] = (grouped[date]['Total'] as number) + amount;
    });

    const data = Object.values(grouped).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setChartData(data);
  }, [grantEntries]);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2, height: 600 }}>
      <Typography variant="h6" gutterBottom>Grant History Over Time</Typography>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <Select
        value={selectedProject?.project_id || ''}
        onChange={(e) => {
          const selected = projects.find(p => p.project_id === Number(e.target.value));
          setSelectedProject(selected || null);
        }}
        displayEmpty
        sx={{ mb: 2, width: 300 }}
      >
        <MenuItem value="">Select a project</MenuItem>
        {projects.map(project => (
          <MenuItem key={project.project_id} value={project.project_id}>
            {project.project_name}
          </MenuItem>
        ))}
      </Select>

      {grantEntries.length > 0 && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Total Grant Received: ₹{grantEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0).toLocaleString()}
        </Typography>
      )}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload) return null;

              const total = payload.reduce((acc, curr) => acc + (curr.value as number), 0);

              return (
                <Paper sx={{ p: 1, borderRadius: 1 }}>
                  <Typography variant="subtitle2">{label}</Typography>
                  {payload.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: entry.color }}>{entry.name}</span>
                      <span>₹{(entry.value as number).toLocaleString()}</span>
                    </Box>
                  ))}
                  <Box sx={{ borderTop: '1px solid #ccc', mt: 1, pt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Total</strong>
                    <strong>₹{total.toLocaleString()}</strong>
                  </Box>
                </Paper>
              );
            }} />
            <Legend />

            {Array.from(new Set(grantEntries.map(entry => entry.field_name)))
              .map(field => (
                <Bar
                  key={field}
                  dataKey={field}
                  stackId="a"
                  fill={stringToColor(field)}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

// Utility: Convert string to consistent color
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = '#' + ((hash >> 24) & 0xff).toString(16).padStart(2, '0') +
    ((hash >> 16) & 0xff).toString(16).padStart(2, '0') +
    ((hash >> 8) & 0xff).toString(16).padStart(2, '0');
  return color.slice(0, 7);
}

export default GrantHistoryChart;
