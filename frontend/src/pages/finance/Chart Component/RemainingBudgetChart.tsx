import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import {
  Box, Typography, Paper
} from "@mui/material";

interface Project {
  project_id: number;
  project_name: string;
}

interface Expenditure {
  amount_spent: string;
}

interface BudgetEntry {
  amount: string;
}

interface ChartDataEntry {
  project_name: string;
  Budget: number;
  Expenditure: number;
  RemainingBudget: number;
  Status: string;
}

const RemainingBudgetChart = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataEntry[]>([]);

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
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          projects.map(async (project) => {
            const [expRes, budRes] = await Promise.all([
              fetch(`http://localhost:5000/api/finance/projects/${project.project_id}/expenditures`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              }),
              fetch(`http://localhost:5000/api/finance/projects/${project.project_id}/budget-entries`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              }),
            ]);

            const expenditures: Expenditure[] = await expRes.json();
            const budgets: BudgetEntry[] = await budRes.json();

            const totalExp = expenditures.reduce((sum, e) => sum + parseFloat(e.amount_spent), 0);
            const totalBud = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
            const remaining = totalBud - totalExp;

            let status = "Exact Budget";
            if (remaining > 0) status = "Under Budget";
            else if (remaining < 0) status = "Over Budget";

            return {
              project_name: project.project_name,
              Budget: totalBud,
              Expenditure: totalExp,
              RemainingBudget: Math.abs(remaining) < 1 ? 0 : remaining,
              Status: status,
            };
          })
        );

        setChartData(results);
      } catch (err) {
        console.error('Failed to fetch project data', err);
        setError('Failed to fetch project data');
      } finally {
        setLoading(false);
      }
    };

    if (projects.length > 0) {
      fetchProjectData();
    }
  }, [projects]);

  const getBarColor = (status: string) => {
    switch (status) {
      case "Under Budget":
        return "#4caf50"; // green
      case "Over Budget":
        return "#f44336"; // red
      default:
        return "#2196f3"; // blue
    }
  };

  // ✅ Custom label renderer to always show outside the bar (left for negative, right for positive)
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    const isPositive = value >= 0;
    const offset = 10;

    return (
      <text
        x={isPositive ? x + width + offset : x - offset}
        y={y + 10}
        fill="#000"
        textAnchor={isPositive ? 'start' : 'end'}
        fontSize={12}
        fontWeight="bold"
      >
        ₹{value.toLocaleString()}
      </text>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Remaining Budget by Project
      </Typography>

      {error && <Typography color="error">{error}</Typography>}
      {loading && <Typography>Loading...</Typography>}

      {!loading && chartData.length > 0 && (
        <Box
          sx={{
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'auto',
          }}
        >
          <Box
            sx={{
              minWidth: '1000px',
              height: `${Math.max(400, chartData.length * 50)}px`,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 20, right: 40, left: 150, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="project_name" />
                <Tooltip
                  wrapperStyle={{ zIndex: 1000 }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
                <Bar dataKey="RemainingBudget" isAnimationActive={false}>
                  <LabelList content={renderCustomLabel} />
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.Status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default RemainingBudgetChart;
