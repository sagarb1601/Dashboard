import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  CircularProgress,
  Chip,
  Autocomplete,
  TextField
} from '@mui/material';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';

interface Project {
  project_id: number;
  project_name: string;
}

interface Employee {
  employee_id: number;
  employee_name: string;
  status: string;
}

interface PiCopiDetails {
  id: number;
  project_id: number;
  project_name: string;
  pi_id: number;
  pi_name: string;
  copi_ids: number[];
  copi_names: string[];
}

const PiCopi = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [piCopiList, setPiCopiList] = useState<PiCopiDetails[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [selectedPI, setSelectedPI] = useState<number | ''>('');
  const [selectedCoPIs, setSelectedCoPIs] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchPiCopiDetails();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/project-status/projects');
      setProjects(response.data);
    } catch (error) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/hr/employees');
      const activeEmployees = response.data.filter((emp: Employee) => emp.status === 'active');
      setEmployees(activeEmployees);
    } catch (error) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPiCopiDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get('/technical/pi-copi');
      setPiCopiList(response.data);
    } catch (error) {
      setError('Failed to fetch PI/CoPI details');
      console.error('Error fetching PI/CoPI details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit', details?: PiCopiDetails) => {
    if (mode === 'edit' && details) {
      setEditMode(true);
      setEditId(details.id);
      setSelectedProject(details.project_id);
      setSelectedPI(details.pi_id);
      setSelectedCoPIs(details.copi_ids);
    } else {
      setEditMode(false);
      setEditId(null);
      setSelectedProject('');
      setSelectedPI('');
      setSelectedCoPIs([]);
    }
    setOpenDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject('');
    setSelectedPI('');
    setSelectedCoPIs([]);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (!selectedProject || !selectedPI) {
        setError('Please select project and PI');
        return;
      }

      const data = {
        project_id: selectedProject,
        pi_id: selectedPI,
        copi_ids: selectedCoPIs
      };

      if (editMode && editId) {
        await api.put(`/technical/pi-copi/${editId}`, data);
      } else {
        await api.post('/technical/pi-copi', data);
      }

      setSuccess(`PI/CoPI details ${editMode ? 'updated' : 'added'} successfully`);
      await fetchPiCopiDetails();
      handleCloseDialog();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || `Failed to ${editMode ? 'update' : 'add'} PI/CoPI details`;
      setError(errorMessage);
      console.error('Error saving PI/CoPI details:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/technical/pi-copi/${id}`);
      setSuccess('PI/CoPI details deleted successfully');
      await fetchPiCopiDetails();
    } catch (error) {
      setError('Failed to delete PI/CoPI details');
      console.error('Error deleting PI/CoPI details:', error);
    }
  };

  return (
    <DashboardLayout>
      <Box p={3}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">PI/CoPI Management</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleOpenDialog('add')}
              disabled={loading}
            >
              Add PI/CoPI
            </Button>
          </Box>

          <Paper>
            <Box p={2}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : piCopiList.length === 0 ? (
                <Typography align="center">No PI/CoPI details found</Typography>
              ) : (
                piCopiList.map((detail) => (
                  <Paper key={detail.id} elevation={2} sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{detail.project_name}</Typography>
                        <Typography><strong>PI:</strong> {detail.pi_name}</Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Typography><strong>Co-PIs:</strong></Typography>
                          {detail.copi_names.map((name, index) => (
                            <Chip key={index} label={name} size="small" />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Button 
                          color="primary" 
                          onClick={() => handleOpenDialog('edit', detail)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button 
                          color="error" 
                          onClick={() => handleDelete(detail.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          </Paper>

          <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>{editMode ? 'Edit PI/CoPI' : 'Add PI/CoPI'}</DialogTitle>
            <DialogContent>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box sx={{ width: '100%', mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={selectedProject}
                    label="Project"
                    onChange={(e) => setSelectedProject(e.target.value as number)}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Autocomplete
                    value={employees.find(emp => emp.employee_id === selectedPI) || null}
                    onChange={(event, newValue) => {
                      setSelectedPI(newValue ? newValue.employee_id : '');
                    }}
                    options={employees}
                    getOptionLabel={(option) => option.employee_name}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Principal Investigator (PI)"
                        placeholder="Search for PI..."
                      />
                    )}
                    clearOnBlur={false}
                    clearOnEscape={false}
                  />
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Autocomplete
                    multiple
                    value={employees.filter(emp => selectedCoPIs.includes(emp.employee_id))}
                    onChange={(event, newValue) => {
                      setSelectedCoPIs(newValue.map(emp => emp.employee_id));
                    }}
                    options={employees}
                    getOptionLabel={(option) => option.employee_name}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Co-Principal Investigators (Co-PIs)"
                        placeholder="Search for Co-PIs..."
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.employee_name}
                          {...getTagProps({ index })}
                          key={option.employee_id}
                        />
                      ))
                    }
                    clearOnBlur={false}
                    clearOnEscape={false}
                  />
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary">
                {editMode ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default PiCopi; 