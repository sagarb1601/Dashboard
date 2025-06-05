import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DashboardLayout from '../../components/DashboardLayout';

interface Project {
  project_id: number;
  project_name: string;
}

interface BudgetField {
  field_id: number;
  field_name: string;
  total_budget: number;
  total_grant_received: number;
}

interface GrantEntry {
  grant_id: number;
  field_id: number;
  field_name: string;
  received_date: string;
  amount: number;
  remarks: string;
}

interface GrantAllocation {
  field_id: number;
  amount: string;
}

const GrantReceivedPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [grantEntries, setGrantEntries] = useState<GrantEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    received_date: new Date().toISOString().split('T')[0],
    remarks: '',
    allocations: [] as GrantAllocation[],
  });

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

  const fetchProjectBudgetFields = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/budget-fields-with-grants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBudgetFields(data);
        setFormData(prev => ({
          ...prev,
          allocations: data.map((field: BudgetField) => ({
            field_id: field.field_id,
            amount: ''
          }))
        }));
      }
    } catch (error) {
      console.error('Error fetching project budget fields:', error);
      setError('Failed to fetch project budget fields');
    }
  };

  const fetchGrantEntries = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject.project_id}/grant-entries`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGrantEntries(data);
      }
    } catch (error) {
      console.error('Error fetching grant entries:', error);
      setError('Failed to fetch grant entries');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectBudgetFields();
      fetchGrantEntries();
    } else {
      setBudgetFields([]);
      setGrantEntries([]);
      setFormData(prev => ({ ...prev, allocations: [] }));
    }
  }, [selectedProject]);

  const handleProjectChange = (event: any) => {
    const project = projects.find(p => p.project_id === event.target.value);
    setSelectedProject(project || null);
  };

  const handleAllocationChange = (fieldId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.map(alloc =>
        alloc.field_id === fieldId ? { ...alloc, amount: value } : alloc
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    // Validate total allocation matches budget
    const totalAllocation = formData.allocations.reduce((sum, alloc) => sum + (Number(alloc.amount) || 0), 0);
    if (totalAllocation === 0) {
      setError('Please allocate grant amount to at least one budget field');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/finance/grant-received', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          project_id: selectedProject.project_id,
          received_date: formData.received_date,
          remarks: formData.remarks,
          allocations: formData.allocations.filter(alloc => Number(alloc.amount) > 0)
        }),
      });

      if (response.ok) {
        setSuccess('Grant received entries added successfully');
        fetchProjectBudgetFields();
        fetchGrantEntries();
        // Reset form
        setFormData({
          received_date: new Date().toISOString().split('T')[0],
          remarks: '',
          allocations: budgetFields.map(field => ({
            field_id: field.field_id,
            amount: ''
          }))
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add grant received entries');
      }
    } catch (error) {
      console.error('Error saving grant received:', error);
      setError('Failed to add grant received entries');
    } finally {
      setLoading(false);
    }
  };

  // Group grant entries by date
  const groupedGrantEntries = grantEntries.reduce((acc, entry) => {
    const dateKey = entry.received_date;
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        remarks: entry.remarks,
        fields: {}
      };
    }
    acc[dateKey].fields[entry.field_id] = entry.amount;
    return acc;
  }, {} as Record<string, { date: string; remarks: string; fields: Record<number, number> }>);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">Grant Received</Typography>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject?.project_id || ''}
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
          </Box>

          {selectedProject && (
            <>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}
              >
                <Typography variant="h6" sx={{ mb: 3 }}>Add New Grant</Typography>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Received Date"
                          value={new Date(formData.received_date)}
                          onChange={(newValue) => {
                            if (newValue) {
                              setFormData(prev => ({
                                ...prev,
                                received_date: newValue.toISOString().split('T')[0]
                              }));
                            }
                          }}
                          sx={{ width: 200 }}
                        />
                      </LocalizationProvider>
                      <TextField
                        sx={{ flex: 1 }}
                        label="Remarks"
                        value={formData.remarks}
                        onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      />
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Budget Field</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {budgetFields.map((field) => {
                            const allocation = formData.allocations.find(a => a.field_id === field.field_id);
                            return (
                              <TableRow key={field.field_id}>
                                <TableCell>{field.field_name}</TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    value={allocation?.amount || ''}
                                    onChange={(e) => handleAllocationChange(field.field_id, e.target.value)}
                                    inputProps={{
                                      step: "0.01",
                                      min: "0"
                                    }}
                                    size="small"
                                    sx={{ width: 200 }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ minWidth: 150 }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save'}
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </Paper>

              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}
              >
                <Typography variant="h6" sx={{ mb: 3 }}>Grant History</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>Budget Field</TableCell>
                        {Object.values(groupedGrantEntries)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => (
                            <TableCell key={entry.date} sx={{ fontWeight: 'bold', minWidth: '150px' }}>
                              {new Date(entry.date).toLocaleDateString()}
                              {entry.remarks && (
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                  {entry.remarks}
                                </Typography>
                              )}
                            </TableCell>
                          ))}
                        <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Total Received</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgetFields.map(field => {
                        const totalReceived = Object.values(groupedGrantEntries)
                          .reduce((sum, entry) => sum + (Number(entry.fields[field.field_id]) || 0), 0);
                        
                        return (
                          <TableRow key={field.field_id}>
                            <TableCell>{field.field_name}</TableCell>
                            {Object.values(groupedGrantEntries)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((entry) => (
                                <TableCell key={entry.date}>
                                  {entry.fields[field.field_id] ? 
                                    Number(entry.fields[field.field_id]).toLocaleString('en-IN', {
                                      maximumFractionDigits: 0,
                                      minimumFractionDigits: 0
                                    }) : '—'}
                                </TableCell>
                              ))}
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {Number(totalReceived).toLocaleString('en-IN', {
                                maximumFractionDigits: 0,
                                minimumFractionDigits: 0
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        {Object.values(groupedGrantEntries)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => {
                            const total = Object.values(entry.fields)
                              .reduce((sum, amount) => sum + Number(amount), 0);
                            return (
                              <TableCell key={entry.date} sx={{ fontWeight: 'bold' }}>
                                {Number(total).toLocaleString('en-IN', {
                                  maximumFractionDigits: 0,
                                  minimumFractionDigits: 0
                                })}
                              </TableCell>
                            );
                          })}
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {Number(
                            Object.values(groupedGrantEntries)
                              .reduce((sum, entry) => 
                                sum + Object.values(entry.fields)
                                  .reduce((s, amount) => s + Number(amount), 0)
                              , 0)
                          ).toLocaleString('en-IN', {
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0
                          })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default GrantReceivedPage; 