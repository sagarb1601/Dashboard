import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Box, Typography, Paper , MenuItem, Select } from "@mui/material";

interface Project {
  project_id: number;
  project_name: string;
}

interface Expenditure {
  year_number: number;
  amount_spent: string;
}

interface BudgetEntry {
  year_number: number;
  amount: string;
}

const ExpenditureBudgetChart = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(false);
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
    const fetchData = async () => {
      if (!selectedProject) return;

      setLoading(true);
      try {
        const [expRes, budRes] = await Promise.all([
          fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/expenditures`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }),
          fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/budget-entries`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }),
        ]);

        const expData = await expRes.json();
        const budData = await budRes.json();

        setExpenditures(expData);
        setBudgets(budData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch project data');
      } finally {
        console.log("Expense", expenditures);
        console.log("Budget", budgets);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProject]);

// Construct chartData outside the function block
const chartData = (() => {
  const expMap = new Map<number, number>(); // year -> total expenditure
  const years: number[] = [];

  // Step 1: Create year -> expenditure map
  expenditures.forEach((exp) => {
    const year = exp.year_number;
    const amount = parseFloat(exp.amount_spent);
    if (!expMap.has(year)) years.push(year);
    expMap.set(year, (expMap.get(year) || 0) + amount);
  });

  // Step 2: Sort years ascending
  years.sort((a, b) => a - b);

  // Step 3: Create yearMap with actual year as key
  const yearMap: { [year: number]: { year: number; Budget?: number; Expenditure?: number } } = {};

  budgets.forEach((budget) => {
    const yearIndex = budget.year_number - 1;
    const actualYear = years[yearIndex];
    if (!actualYear) return;

    const amount = parseFloat(budget.amount);
    if (!yearMap[actualYear]) yearMap[actualYear] = { year: actualYear };
    yearMap[actualYear].Budget = (yearMap[actualYear].Budget || 0) + amount;
  });

  expMap.forEach((amount, year) => {
    if (!yearMap[year]) yearMap[year] = { year };
    yearMap[year].Expenditure = amount;
  });

  return Object.values(yearMap).sort((a, b) => a.year - b.year);
})();


  return (
    <Paper elevation={3} sx={{ p: 3, m:3,  borderRadius: 2, height: 500 }}>
      <h2>Year-wise Budget vs Expenditure</h2>

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
      {loading && <p>Loading...</p>}

      {!loading && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400} >
          <BarChart data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="Budget" fill="#82ca9d" />
            <Bar dataKey="Expenditure" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

export default ExpenditureBudgetChart;
