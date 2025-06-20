import React, { useEffect, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import BudgetExpenditureChart from "./Chart Component/BudgetExpenditureChart";
import LookerStudioEmbed from "./Chart Component/LookerStudioEmbed";
import GrantHistoryChart from "./Chart Component/GrantHistoryChart";
import RemainingBudgetChart from "./Chart Component/RemainingBudgetChart";

interface Project {
  project_id: number;
  project_name: string;
  start_date: string;
  end_date: string;
  extension_end_date: string | null;
  total_value: string;
  funding_agency: string;
  duration_years: number;
  created_at: string;
  no_of_project: string;
}

interface ChartData {
  name: string;
  value: number;
  projectQuantity: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper sx={{ p: 1 }}>
        <Typography variant="body2">
          <strong>Funding Agency:</strong> {data.name}
        </Typography>
        <Typography variant="body2">
          <strong>Total Value:</strong> ₹{data.value.toLocaleString()}
        </Typography>
        <Typography variant="body2">
          <strong>No. of Projects:</strong> {data.projectQuantity}
        </Typography>
      </Paper>
    );
  }
  return null;
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#9C27B0",
  "#FF5252",
];

const FinanceHome = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [data, setData] = useState<ChartData[]>([]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/finance/projects/group-by-funding-agency",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const json = await response.json();
        console.log(json);
        setProjects(json);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const chartData: ChartData[] = projects.map((project) => ({
      name: project.funding_agency,
      value: parseFloat(project.total_value),
      projectQuantity: parseInt(project.no_of_project),
    }));
    setData(chartData);
  }, [projects]);

  return (
    <DashboardLayout>
      <Paper elevation={3} sx={{ p: 3, m:3, borderRadius: 2, height: 400 }}>
        <Typography variant="h6" gutterBottom>
          Project Funding Overview
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      <BudgetExpenditureChart/>
      <GrantHistoryChart></GrantHistoryChart>
      <RemainingBudgetChart></RemainingBudgetChart>
      {/* <LookerStudioEmbed/> */}
      
    </DashboardLayout>
  );
};

export default FinanceHome;
