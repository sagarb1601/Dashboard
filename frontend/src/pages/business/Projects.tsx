import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../utils/api';

interface Project {
  id: number;
  entity_id: number;
  entity_name: string;
  client_name: string;
  order_value: number;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  extended_date: string | null;
  milestones: any[];
  created_at: string;
  updated_at: string;
}

interface BusinessEntity {
  id: number;
  name: string;
  entity_type: 'product' | 'project' | 'service';
  client_name: string;
  order_value: number;
}

interface FormData {
  entity_id: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  extended_date: string | null;
  milestones: any[];
}

const initialFormData: FormData = {
  entity_id: '',
  status: 'active',
  extended_date: null,
  milestones: []
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/business/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showSnackbar('Failed to fetch projects', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const response = await api.get('/business/business-entities');
      setEntities(response.data.filter((entity: BusinessEntity) => entity.entity_type === 'project'));
    } catch (error) {
      console.error('Error fetching entities:', error);
      showSnackbar('Failed to fetch entities', 'error');
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchEntities();
  }, [fetchProjects, fetchEntities]);

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        entity_id: parseInt(formData.entity_id)
      };

      if (selectedProject) {
        await api.put(`/business/projects/${selectedProject.id}`, submitData);
        showSnackbar('Project updated successfully', 'success');
      } else {
        await api.post('/business/projects', submitData);
        showSnackbar('Project created successfully', 'success');
      }
      handleCloseDialog();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      showSnackbar('Failed to save project', 'error');
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.delete(`/business/projects/${project.id}`);
      showSnackbar('Project deleted successfully', 'success');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      showSnackbar('Failed to delete project', 'error');
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        entity_id: project.entity_id.toString(),
        status: project.status,
        extended_date: project.extended_date,
        milestones: project.milestones || []
      });
    } else {
      setSelectedProject(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject(null);
    setFormData(initialFormData);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Project
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Order Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Extended Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.entity_name}</TableCell>
                <TableCell>{project.client_name}</TableCell>
                <TableCell>₹{project.order_value.toLocaleString()}</TableCell>
                <TableCell>{project.status}</TableCell>
                <TableCell>
                  {project.extended_date ? new Date(project.extended_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(project)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(project)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProject ? 'Edit Project' : 'Add New Project'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth required>
              <InputLabel>Business Entity</InputLabel>
              <Select
                value={formData.entity_id}
                label="Business Entity"
                onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
              >
                {entities.map((entity) => (
                  <MenuItem key={entity.id} value={entity.id.toString()}>
                    {entity.name} ({entity.client_name}) - ₹{entity.order_value.toLocaleString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({
                  ...formData,
                  status: e.target.value as 'active' | 'completed' | 'on-hold' | 'cancelled'
                })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on-hold">On Hold</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Extended Date"
                value={formData.extended_date ? new Date(formData.extended_date) : null}
                onChange={(date) => setFormData({
                  ...formData,
                  extended_date: date ? date.toISOString().split('T')[0] : null
                })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined'
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Projects; 