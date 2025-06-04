import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';

interface Project {
  project_id: number;
  project_name: string;
  duration_years: number;
}

interface BudgetField {
  field_id: number;
  field_name: string;
}

interface YearlyBudgetData {
  [key: number]: { // year number
    [key: number]: number; // field_id: amount
  };
}

const YearlyBudget = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [projectBudgetFields, setProjectBudgetFields] = useState<BudgetField[]>([]);
  const [yearlyBudgetData, setYearlyBudgetData] = useState<YearlyBudgetData>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<Project | null>(null);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/finance/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  };

  // Fetch budget fields mapped to the selected project
  const fetchProjectBudgetFields = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-fields`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjectBudgetFields(data);
      }
    } catch (error) {
      console.error('Error fetching project budget fields:', error);
      setError('Failed to fetch project budget fields');
    }
  };

  // Fetch existing budget entries for the selected project
  const fetchExistingBudgetEntries = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-entries`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const budgetData: YearlyBudgetData = {};
        
        // Transform the data into our desired format
        data.forEach((entry: any) => {
          if (!budgetData[entry.year_number]) {
            budgetData[entry.year_number] = {};
          }
          budgetData[entry.year_number][entry.field_id] = entry.amount;
        });
        
        setYearlyBudgetData(budgetData);
      }
    } catch (error) {
      console.error('Error fetching budget entries:', error);
      setError('Failed to fetch budget entries');
    }
  };

  // Fetch project details when a project is selected
  const fetchProjectDetails = async (projectId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedProjectDetails(data);
        
        // Initialize yearly budget data structure
        const initialBudgetData: YearlyBudgetData = {};
        for (let year = 1; year <= data.duration_years; year++) {
          initialBudgetData[year] = {};
        }
        setYearlyBudgetData(initialBudgetData);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      setError('Failed to fetch project details');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectBudgetFields();
      fetchProjectDetails(selectedProject as number);
      fetchExistingBudgetEntries();
    } else {
      setProjectBudgetFields([]);
      setYearlyBudgetData({});
      setSelectedProjectDetails(null);
    }
  }, [selectedProject]);

  const handleProjectChange = (event: any) => {
    setSelectedProject(event.target.value);
  };

  const handleAmountChange = (year: number, fieldId: number, value: string) => {
    const amount = value === '' ? 0 : parseFloat(value);
    setYearlyBudgetData(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [fieldId]: amount
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedProject || !selectedProjectDetails) return;

    setLoading(true);
    try {
      // First delete existing entries
      await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-entries`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Then create new entries
      const entries = [];
      for (const year in yearlyBudgetData) {
        for (const fieldId in yearlyBudgetData[year]) {
          entries.push({
            project_id: selectedProject,
            field_id: parseInt(fieldId),
            year_number: parseInt(year),
            amount: yearlyBudgetData[year][fieldId]
          });
        }
      }

      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ entries }),
      });

      if (response.ok) {
        setSuccess('Budget entries saved successfully');
        fetchExistingBudgetEntries();
      } else {
        setError('Failed to save budget entries');
      }
    } catch (error) {
      console.error('Error saving budget entries:', error);
      setError('Failed to save budget entries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">Year-wise Budget Details</Typography>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={!selectedProject || loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProject}
              onChange={handleProjectChange}
              label="Select Project"
            >
              {projects.map((project) => (
                <MenuItem key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedProjectDetails && (
            <Alert severity="info">
              This project runs for {selectedProjectDetails.duration_years} year{selectedProjectDetails.duration_years > 1 ? 's' : ''}
            </Alert>
          )}

          {selectedProjectDetails && projectBudgetFields.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Budget Field</TableCell>
                    {Array.from({ length: selectedProjectDetails.duration_years }, (_, i) => (
                      <TableCell key={i + 1}>Year {i + 1}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectBudgetFields.map((field) => (
                    <TableRow key={field.field_id}>
                      <TableCell>{field.field_name}</TableCell>
                      {Array.from({ length: selectedProjectDetails.duration_years }, (_, i) => {
                        const year = i + 1;
                        return (
                          <TableCell key={year}>
                            <TextField
                              type="number"
                              value={yearlyBudgetData[year]?.[field.field_id] || ''}
                              onChange={(e) => handleAmountChange(year, field.field_id, e.target.value)}
                              InputProps={{
                                inputProps: { min: 0, step: 0.01 }
                              }}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {selectedProject && projectBudgetFields.length === 0 && (
            <Alert severity="warning">
              No budget fields are mapped to this project. Please map budget fields in the Budget Fields section first.
            </Alert>
          )}
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default YearlyBudget; 