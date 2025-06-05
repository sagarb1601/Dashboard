import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Typography, FormControl, InputLabel,
  Select, MenuItem, SelectChangeEvent, Alert, Snackbar
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../utils/api';

interface Client {
  id: number;
  client_name: string;
}

interface BusinessEntity {
  id: number;
  name: string;
  entity_type: 'product' | 'project' | 'service';
  client_id: number;
  client_name: string;
  start_date: string;
  end_date: string;
  order_value: number;
  payment_duration: string;
  description: string;
}

const initialFormData = {
  name: '',
  entity_type: '' as 'product' | 'project' | 'service',
  client_id: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  order_value: '',
  payment_duration: '',
  description: ''
};

const paymentDurations = [
  'Monthly',
  'Quarterly',
  'Half-yearly',
  'Yearly',
  'One-time'
];

const BusinessEntities = () => {
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedEntity, setSelectedEntity] = useState<BusinessEntity | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchEntities();
    fetchClients();
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const response = await api.get('/business/business-entities');
      setEntities(response.data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      showSnackbar('Failed to fetch entities', 'error');
    }
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/business/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showSnackbar('Failed to fetch clients', 'error');
    }
  };

  const handleOpenDialog = (entity?: BusinessEntity) => {
    if (entity) {
      setSelectedEntity(entity);
      setFormData({
        name: entity.name,
        entity_type: entity.entity_type,
        client_id: entity.client_id.toString(),
        start_date: entity.start_date,
        end_date: entity.end_date,
        order_value: entity.order_value.toString(),
        payment_duration: entity.payment_duration,
        description: entity.description
      });
    } else {
      setSelectedEntity(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEntity(null);
    setFormData(initialFormData);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        client_id: parseInt(formData.client_id),
        order_value: parseFloat(formData.order_value)
      };

      if (selectedEntity) {
        await api.put(`/business/business-entities/${selectedEntity.id}`, submitData);
        showSnackbar('Business entity updated successfully', 'success');
      } else {
        await api.post('/business/business-entities', submitData);
        showSnackbar('Business entity created successfully', 'success');
      }
      handleCloseDialog();
      fetchEntities();
    } catch (error) {
      console.error('Error saving business entity:', error);
      showSnackbar('Failed to save business entity', 'error');
    }
  };

  const handleDelete = async (entity: BusinessEntity) => {
    try {
      await api.delete(`/business/business-entities/${entity.id}`);
      showSnackbar('Business entity deleted successfully', 'success');
      fetchEntities();
    } catch (error: any) {
      console.error('Error deleting business entity:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete business entity';
      showSnackbar(errorMessage, 'error');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Business Entities</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Add New Entity
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Order Value</TableCell>
              <TableCell>Payment Duration</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity.id}>
                <TableCell>{entity.name}</TableCell>
                <TableCell>{entity.entity_type}</TableCell>
                <TableCell>{entity.client_name}</TableCell>
                <TableCell>{new Date(entity.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(entity.end_date).toLocaleDateString()}</TableCell>
                <TableCell>₹{entity.order_value.toLocaleString()}</TableCell>
                <TableCell>{entity.payment_duration}</TableCell>
                <TableCell>{entity.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(entity)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(entity)} size="small" color="error">
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
          {selectedEntity ? 'Edit Business Entity' : 'Add New Business Entity'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.entity_type}
                label="Type"
                onChange={(e: SelectChangeEvent) => 
                  setFormData({ ...formData, entity_type: e.target.value as 'product' | 'project' | 'service' })}
              >
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="service">Service</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Client</InputLabel>
              <Select
                value={formData.client_id}
                label="Client"
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id.toString()}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={new Date(formData.start_date)}
                onChange={(date) => date && setFormData({ 
                  ...formData, 
                  start_date: date.toISOString().split('T')[0]
                })}
              />

              <DatePicker
                label="End Date"
                value={new Date(formData.end_date)}
                onChange={(date) => date && setFormData({ 
                  ...formData, 
                  end_date: date.toISOString().split('T')[0]
                })}
              />
            </LocalizationProvider>

            <TextField
              label="Order Value"
              type="number"
              value={formData.order_value}
              onChange={(e) => setFormData({ ...formData, order_value: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography>₹</Typography>
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Payment Duration</InputLabel>
              <Select
                value={formData.payment_duration}
                label="Payment Duration"
                onChange={(e) => setFormData({ ...formData, payment_duration: e.target.value })}
              >
                {paymentDurations.map((duration) => (
                  <MenuItem key={duration} value={duration}>
                    {duration}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedEntity ? 'Update' : 'Create'}
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

export default BusinessEntities; 