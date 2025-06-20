import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import api from '../../utils/api';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

interface Project {
  id: number;
  entity_id: number;
  entity_name: string;
  client_name: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  extended_date: string | null;
  milestones: any;
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

const BDProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    entity_id: '',
    status: 'active',
    extended_date: null as Date | null,
    milestones: {}
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    fetchProjects();
    fetchEntities();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/business/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showSnackbar('Failed to fetch projects', 'error');
    }
  };

  const fetchEntities = async () => {
    try {
      console.log('Fetching business entities...');
      const response = await api.get('/business/business-entities');
      console.log('Business entities response:', response.data);
      const projectEntities = response.data.filter((entity: BusinessEntity) => 
        entity.entity_type === 'project'
      );
      console.log('Filtered project entities:', projectEntities);
      setEntities(projectEntities);
    } catch (error) {
      console.error('Error fetching business entities:', error);
      showSnackbar('Failed to fetch business entities', 'error');
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        entity_id: project.entity_id.toString(),
        status: project.status,
        extended_date: project.extended_date ? new Date(project.extended_date) : null,
        milestones: project.milestones || {}
      });
    } else {
      setSelectedProject(null);
      setFormData({
        entity_id: '',
        status: 'active',
        extended_date: null,
        milestones: {}
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject(null);
    setFormData({
      entity_id: '',
      status: 'active',
      extended_date: null,
      milestones: {}
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        entity_id: parseInt(formData.entity_id),
        extended_date: formData.extended_date ? formData.extended_date.toISOString().split('T')[0] : null
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

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/business/projects/${id}`);
      showSnackbar('Project deleted successfully', 'success');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      showSnackbar('Failed to delete project', 'error');
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Business Division Projects</Typography>
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
              <TableCell>Client Name</TableCell>
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
                <TableCell>
                  <Typography
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: 
                        project.status === 'active' ? '#e8f5e9' :
                        project.status === 'completed' ? '#e3f2fd' :
                        project.status === 'on-hold' ? '#fff3e0' :
                        '#ffebee',
                      color: 
                        project.status === 'active' ? '#2e7d32' :
                        project.status === 'completed' ? '#1565c0' :
                        project.status === 'on-hold' ? '#f57c00' :
                        '#c62828'
                    }}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {project.extended_date ? new Date(project.extended_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(project)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(project.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary">No projects found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProject ? 'Edit Project' : 'Add New Project'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={2}>
            <FormControl fullWidth required>
              <InputLabel>Business Entity</InputLabel>
              <Select
                value={formData.entity_id}
                label="Business Entity"
                onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
              >
                {entities.map((entity) => (
                  <MenuItem key={entity.id} value={entity.id.toString()}>
                    <Box>
                      <Typography variant="subtitle1">
                        {entity.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Client: {entity.client_name} • Value: ₹{entity.order_value.toLocaleString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
                {entities.length === 0 && (
                  <MenuItem disabled>
                    <Typography color="textSecondary">
                      No project entities available. Create a business entity first.
                    </Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              label="Status"
              select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on-hold">On Hold</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <DesktopDatePicker
              label="Extended Date"
              value={formData.extended_date}
              onChange={(date) => setFormData({ ...formData, extended_date: date ? dayjs(date).toDate() : null })}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BDProjects; 