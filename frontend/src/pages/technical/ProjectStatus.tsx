import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  TextField,
  CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';

interface Project {
  project_id: number;
  project_name: string;
  status: string;
  updated_at: string;
  updated_by_name: string | null;
}

interface Employee {
  employee_id: number;
  employee_name: string;
}

const ProjectStatus = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Filter employees based on search text
    if (employeeSearch.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const searchText = employeeSearch.toLowerCase();
      setFilteredEmployees(
        employees.filter(emp => 
          emp.employee_name.toLowerCase().includes(searchText)
        )
      );
    }
  }, [employeeSearch, employees]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/project-status/projects');
      setProjects(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch projects. Please try again.');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/project-status/employees');
      setEmployees(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch employees. Please try again.');
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedEmployee('');
    setEmployeeSearch('');
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      if (!selectedProject || !selectedStatus || !selectedEmployee) {
        setError('Please fill in all fields');
        return;
      }

      setLoading(true);
      await api.post('/project-status/status', {
        projectId: selectedProject,
        status: selectedStatus,
        updatedBy: selectedEmployee
      });

      setSuccess('Status updated successfully');
      await fetchProjects(); // Refresh the projects list
      handleCloseDialog();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update status. Please try again.');
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmployeeSearch(event.target.value);
  };

  const handleEmployeeSelect = (employeeId: number) => {
    setSelectedEmployee(employeeId);
    setEmployeeSearch(''); // Clear search after selection
  };

  return (
    <DashboardLayout>
      <Box p={3}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Project Status</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleOpenDialog}
              disabled={loading}
            >
              Add Project Status
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Updated By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.filter(project => project.status !== 'Just Boarded').map((project) => (
                    <TableRow key={project.project_id}>
                      <TableCell>{project.project_name}</TableCell>
                      <TableCell>{project.status}</TableCell>
                      <TableCell>
                        {new Date(project.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{project.updated_by_name || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Add Project Status</DialogTitle>
            <DialogContent>
              <Box sx={{ width: '100%', mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={selectedProject}
                    label="Project"
                    onChange={(e: SelectChangeEvent<number | ''>) => 
                      setSelectedProject(e.target.value)}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="Ongoing">Ongoing</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Just Boarded">Just Boarded</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="Search Employee"
                    value={employeeSearch}
                    onChange={handleEmployeeSearch}
                    fullWidth
                  />
                  {employeeSearch && (
                    <Paper 
                      style={{ 
                        maxHeight: 200, 
                        overflowY: 'auto',
                        marginTop: 8,
                        position: 'relative',
                        width: '100%',
                        zIndex: 1
                      }}
                    >
                      {filteredEmployees.length === 0 ? (
                        <MenuItem disabled>No employees found</MenuItem>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <MenuItem
                            key={employee.employee_id}
                            onClick={() => handleEmployeeSelect(employee.employee_id)}
                            selected={employee.employee_id === selectedEmployee}
                          >
                            {employee.employee_name}
                          </MenuItem>
                        ))
                      )}
                    </Paper>
                  )}
                  {selectedEmployee && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selected: {employees.find(e => e.employee_id === selectedEmployee)?.employee_name}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Add Status'}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default ProjectStatus; 