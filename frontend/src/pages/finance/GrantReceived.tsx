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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DashboardLayout from '../../components/DashboardLayout';
import { BASE_URL } from '../../utils/api';
import { format } from 'date-fns';

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
  field_name: string;
}

const GrantReceivedPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [grantEntries, setGrantEntries] = useState<GrantEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    received_date: new Date().toISOString().split('T')[0],
    remarks: '',
    allocations: [] as GrantAllocation[]
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

  const fetchProjectBudgetFields = async (projectId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${projectId}/budget-fields-with-grants`, {
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
            amount: '',
            field_name: field.field_name
          }))
        }));
      }
    } catch (error) {
      console.error('Error fetching project budget fields:', error);
      setError('Failed to fetch project budget fields');
    }
  };

  const fetchGrantEntries = async (projectId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${projectId}/grant-entries`, {
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
      fetchProjectBudgetFields(selectedProject.project_id);
      fetchGrantEntries(selectedProject.project_id);
    } else {
      setBudgetFields([]);
      setGrantEntries([]);
      setFormData(prev => ({ ...prev, allocations: [] }));
    }
  }, [selectedProject]);

  const handleProjectChange = (event: any) => {
    const projectId = event.target.value;
    const project = projects.find(p => p.project_id === projectId);
    setSelectedProject(project || null);
    if (project) {
      fetchProjectBudgetFields(project.project_id);
      fetchGrantEntries(project.project_id);
    }
  };

  const handleAllocationChange = (fieldId: number, value: string) => {
    setFormData(prev => {
      const allocations = [...prev.allocations];
      const index = allocations.findIndex(a => a.field_id === fieldId);
      
      if (index >= 0) {
        allocations[index] = { ...allocations[index], amount: value };
      } else {
        allocations.push({ field_id: fieldId, amount: value, field_name: '' });
      }
      
      return { ...prev, allocations };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate allocations
      const validAllocations = formData.allocations.filter(alloc => {
        const amount = Number(alloc.amount);
        return !isNaN(amount) && amount > 0;
      });

      if (validAllocations.length === 0) {
        setError('Please enter valid amounts for at least one allocation');
        return;
      }

      // Format date to YYYY-MM-DD without time
      const formattedDate = format(new Date(formData.received_date), 'yyyy-MM-dd');
      
      const requestData = {
        project_id: selectedProject.project_id,
        received_date: formattedDate,
        remarks: formData.remarks,
        allocations: validAllocations.map(alloc => ({
          field_id: alloc.field_id,
          amount: Number(alloc.amount).toFixed(2)
        }))
      };

      const response = await fetch(`${BASE_URL}/grant-received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add grant entry');
      }

      setSuccess('Grant entry added successfully');
      setFormData({
        received_date: new Date().toISOString().split('T')[0],
        remarks: '',
        allocations: []
      });
      fetchGrantEntries(selectedProject.project_id);
    } catch (error) {
      console.error('Error adding grant:', error);
      setError(error instanceof Error ? error.message : 'Failed to add grant entry');
    } finally {
      setLoading(false);
    }
  };

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
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ 
                position: 'sticky',
                top: 16,
                zIndex: 1000,
                boxShadow: 2
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              onClose={() => setSuccess(null)}
              sx={{ 
                position: 'sticky',
                top: error ? 80 : 16,
                zIndex: 1000,
                boxShadow: 2
              }}
            >
              {success}
            </Alert>
          )}

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
                              {format(new Date(entry.date), 'dd-MM-yyyy')}
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