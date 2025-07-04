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
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
    received_date: format(new Date(), 'yyyy-MM-dd'),
    remarks: '',
    allocations: [] as GrantAllocation[]
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editAllocations, setEditAllocations] = useState<GrantAllocation[]>([]);
  const [editRemarks, setEditRemarks] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDate, setDeleteDate] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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
      // Validate allocations - allow zero and negative values
      const validAllocations = formData.allocations.filter(alloc => {
        const amount = Number(alloc.amount);
        return !isNaN(amount); // Only check if it's a valid number
      });

      if (validAllocations.length === 0) {
        setError('Please enter valid amounts for at least one allocation');
        return;
      }

      const requestData = {
        project_id: selectedProject.project_id,
        received_date: formData.received_date,
        remarks: formData.remarks,
        allocations: validAllocations.map(alloc => ({
          field_id: alloc.field_id,
          amount: Number(alloc.amount).toFixed(2)
        }))
      };

      const response = await fetch(`${BASE_URL}/finance/grant-received`, {
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
        received_date: format(new Date(), 'yyyy-MM-dd'),
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

  // Open edit modal for a date
  const handleEditDate = (date: string) => {
    // Ensure date is in YYYY-MM-DD format
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    setEditDate(formattedDate);
    // Pre-fill allocations for all fields for this date
    const entry = groupedGrantEntries[date];
    setEditRemarks(entry?.remarks || '');
    setEditAllocations(
      budgetFields.map(field => ({
        field_id: field.field_id,
        field_name: field.field_name,
        amount: entry?.fields[field.field_id]?.toString() || ''
      }))
    );
    setEditModalOpen(true);
  };

  const handleEditAllocationChange = (fieldId: number, value: string) => {
    setEditAllocations(prev =>
      prev.map(a => a.field_id === fieldId ? { ...a, amount: value } : a)
    );
  };

  const handleEditSave = async () => {
    if (!selectedProject || !editDate) return;
    setEditLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Allow zero and negative values
      const validAllocations = editAllocations.filter(a => !isNaN(Number(a.amount)));
      
      const formattedDate = format(new Date(editDate), 'yyyy-MM-dd');
      
      const payload = {
        project_id: selectedProject.project_id,
        received_date: formattedDate,
        grants: validAllocations.map(a => ({
          field_id: a.field_id,
          amount: Number(a.amount),
          remarks: editRemarks
        }))
      };

      console.log('Sending bulk edit request:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${BASE_URL}/finance/grant-received/bulk-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.error || data.details || 'Failed to update grant received');
      }
      setSuccess('Grant received updated successfully');
      setEditModalOpen(false);
      setEditDate(null);
      fetchGrantEntries(selectedProject.project_id);
    } catch (error) {
      console.error('Error in handleEditSave:', error);
      setError(error instanceof Error ? error.message : 'Failed to update grant received');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteDate = (date: string) => {
    // Ensure date is in YYYY-MM-DD format
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    setDeleteDate(formattedDate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject || !deleteDate) return;
    setDeleteLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // The date is already in YYYY-MM-DD format from handleDeleteDate
      console.log('Grant Delete - Sending date:', deleteDate);
      
      // Use the bulk-edit endpoint to delete all entries for this date
      const response = await fetch(`${BASE_URL}/finance/grant-received/bulk-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          project_id: selectedProject.project_id,
          received_date: deleteDate,
          grants: [] // Empty array means delete all entries for this date
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete grant received');
      }

      setSuccess('Grant received deleted successfully');
      setDeleteDialogOpen(false);
      setDeleteDate(null);
      fetchGrantEntries(selectedProject.project_id);
    } catch (error) {
      console.error('Error in handleDeleteConfirm:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete grant received');
    } finally {
      setDeleteLoading(false);
    }
  };

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
                                received_date: format(newValue, 'yyyy-MM-dd')
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
                            <TableCell key={entry.date} sx={{ fontWeight: 'bold', minWidth: '150px', position: 'relative' }}>
                              {format(new Date(entry.date), 'dd-MM-yyyy')}
                              {entry.remarks && (
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                  {entry.remarks}
                                </Typography>
                              )}
                              <Box sx={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 1 }}>
                                <IconButton size="small" onClick={() => handleEditDate(entry.date)}><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => handleDeleteDate(entry.date)}><DeleteIcon fontSize="small" /></IconButton>
                              </Box>
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

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Grant Received for {editDate ? format(new Date(editDate), 'dd-MM-yyyy') : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Remarks"
              value={editRemarks}
              onChange={e => setEditRemarks(e.target.value)}
              fullWidth
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Budget Field</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editAllocations.map(a => (
                    <TableRow key={a.field_id}>
                      <TableCell>{a.field_name}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={a.amount}
                          onChange={e => handleEditAllocationChange(a.field_id, e.target.value)}
                          inputProps={{ step: '0.01', min: '0' }}
                          size="small"
                          sx={{ width: 150 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)} disabled={editLoading}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editLoading}>
            {editLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Grant Received</DialogTitle>
        <DialogContent>
          Are you sure you want to delete all grant received entries for {deleteDate ? format(new Date(deleteDate), 'dd-MM-yyyy') : ''}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default GrantReceivedPage;