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
import api from '../../utils/api';

interface Service {
  id: number;
  entity_id: number;
  entity_name: string;
  client_name: string;
  order_value: number;
  service_type: 'hpc' | 'vapt' | 'training';
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  service_specific_details: any;
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
  service_type: 'hpc' | 'vapt' | 'training';
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  service_specific_details: any;
}

const initialFormData: FormData = {
  entity_id: '',
  service_type: 'hpc',
  status: 'active',
  service_specific_details: {}
};

const BDServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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

  const fetchServices = useCallback(async () => {
    try {
      const response = await api.get('/business/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      showSnackbar('Failed to fetch services', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const response = await api.get('/business/business-entities');
      setEntities(response.data.filter((entity: BusinessEntity) => entity.entity_type === 'service'));
    } catch (error) {
      console.error('Error fetching entities:', error);
      showSnackbar('Failed to fetch entities', 'error');
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchEntities();
  }, [fetchServices, fetchEntities]);

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        entity_id: parseInt(formData.entity_id)
      };

      if (selectedService) {
        await api.put(`/business/services/${selectedService.id}`, submitData);
        showSnackbar('Service updated successfully', 'success');
      } else {
        await api.post('/business/services', submitData);
        showSnackbar('Service created successfully', 'success');
      }
      handleCloseDialog();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      showSnackbar('Failed to save service', 'error');
    }
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await api.delete(`/business/services/${service.id}`);
      showSnackbar('Service deleted successfully', 'success');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      showSnackbar('Failed to delete service', 'error');
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        entity_id: service.entity_id.toString(),
        service_type: service.service_type,
        status: service.status,
        service_specific_details: service.service_specific_details || {}
      });
    } else {
      setSelectedService(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
    setFormData(initialFormData);
  };

  const renderServiceSpecificFields = () => {
    switch (formData.service_type) {
      case 'hpc':
        return (
          <>
            <TextField
              label="Number of Cores"
              type="number"
              value={formData.service_specific_details.num_cores || ''}
              onChange={(e) => setFormData({
                ...formData,
                service_specific_details: {
                  ...formData.service_specific_details,
                  num_cores: parseInt(e.target.value)
                }
              })}
              fullWidth
              required
            />
            <TextField
              label="Comments"
              value={formData.service_specific_details.comments || ''}
              onChange={(e) => setFormData({
                ...formData,
                service_specific_details: {
                  ...formData.service_specific_details,
                  comments: e.target.value
                }
              })}
              fullWidth
              multiline
              rows={3}
            />
          </>
        );

      case 'vapt':
        return (
          <TextField
            label="Comments"
            value={formData.service_specific_details.comments || ''}
            onChange={(e) => setFormData({
              ...formData,
              service_specific_details: {
                ...formData.service_specific_details,
                comments: e.target.value
              }
            })}
            fullWidth
            multiline
            rows={3}
          />
        );

      case 'training':
        return (
          <TextField
            label="Training Topic"
            value={formData.service_specific_details.training_on || ''}
            onChange={(e) => setFormData({
              ...formData,
              service_specific_details: {
                ...formData.service_specific_details,
                training_on: e.target.value
              }
            })}
            fullWidth
            required
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Services</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Service
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Order Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.entity_name}</TableCell>
                <TableCell>{service.client_name}</TableCell>
                <TableCell>{service.service_type.toUpperCase()}</TableCell>
                <TableCell>₹{service.order_value.toLocaleString()}</TableCell>
                <TableCell>{service.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(service)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(service)} size="small" color="error">
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
          {selectedService ? 'Edit Service' : 'Add New Service'}
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
              <InputLabel>Service Type</InputLabel>
              <Select
                value={formData.service_type}
                label="Service Type"
                onChange={(e) => setFormData({
                  ...formData,
                  service_type: e.target.value as 'hpc' | 'vapt' | 'training',
                  service_specific_details: {}
                })}
              >
                <MenuItem value="hpc">HPC</MenuItem>
                <MenuItem value="vapt">VAPT</MenuItem>
                <MenuItem value="training">Training</MenuItem>
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

            {renderServiceSpecificFields()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedService ? 'Update' : 'Create'}
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

export default BDServices; 