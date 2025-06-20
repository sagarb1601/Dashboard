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
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
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
  const [editMode, setEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

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

  const handleOpenDialog = (mode: 'add' | 'edit' = 'add', project?: Project) => {
    if (mode === 'edit' && project) {
      setEditMode(true);
      setEditingProjectId(project.project_id);
      setSelectedProject(project.project_id);
      setSelectedStatus(project.status);
      // Find the employee who last updated this project
      const lastUpdatedEmployee = employees.find(emp => emp.employee_name === project.updated_by_name);
      setSelectedEmployee(lastUpdatedEmployee?.employee_id || '');
    } else {
      setEditMode(false);
      setEditingProjectId(null);
      setSelectedProject('');
      setSelectedStatus('');
      setSelectedEmployee('');
    }
    setOpenDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setEditingProjectId(null);
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

      setSuccess(`Status ${editMode ? 'updated' : 'added'} successfully`);
      await fetchProjects(); // Refresh the projects list
      handleCloseDialog();
    } catch (error: any) {
      setError(error.response?.data?.error || `Failed to ${editMode ? 'update' : 'add'} status. Please try again.`);
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project status?')) {
      try {
        setLoading(true);
        await api.delete(`/project-status/status/${projectId}`);
        setSuccess('Project status deleted successfully');
        await fetchProjects(); // Refresh the projects list
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete project status. Please try again.');
        console.error('Error deleting project status:', error);
      } finally {
        setLoading(false);
      }
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
    <Box p={3}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Project Status</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleOpenDialog()}
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
                <TableCell>Updated By</TableCell>
                <TableCell align="center">Actions</TableCell>
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
                    <TableCell>{project.updated_by_name || '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Project Status">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog('edit', project)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Project Status">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(project.project_id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Project Status' : 'Add Project Status'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={selectedProject}
                  label="Project"
                  onChange={(e) => setSelectedProject(e.target.value as number)}
                  disabled={editMode} // Disable project selection in edit mode
                >
                  {projects.map((project) => (
                    <MenuItem key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="Just Boarded">Just Boarded</MenuItem>
                  <MenuItem value="Ongoing">Ongoing</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <TextField
                  fullWidth
                  label="Search Employee"
                  value={employeeSearch}
                  onChange={handleEmployeeSearch}
                  placeholder="Type to search for an employee..."
                />
                {employeeSearch && (
                  <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider' }}>
                    {filteredEmployees.map((employee) => (
                      <Box
                        key={employee.employee_id}
                        sx={{
                          p: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          backgroundColor: selectedEmployee === employee.employee_id ? 'action.selected' : 'transparent'
                        }}
                        onClick={() => handleEmployeeSelect(employee.employee_id)}
                      >
                        {employee.employee_name}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
              {editMode ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
};

export default ProjectStatus; 