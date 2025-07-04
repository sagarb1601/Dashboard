import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Typography, FormControl, InputLabel,
  Select, MenuItem, SelectChangeEvent, Alert, Snackbar, Stack, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
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
  service_type?: 'hpc' | 'training' | 'vapt';
  client_id: number;
  client_name: string;
  start_date: string;
  end_date: string;
  order_value: number;
  payment_duration: string;
  description: string;
}

interface BusinessEntityFormData {
  name: string;
  entity_type: 'product' | 'project' | 'service';
  service_type?: 'hpc' | 'training' | 'vapt';
  client_id: string;
  start_date: string;
  end_date: string;
  order_value: string;
  payment_duration: string;
  description: string;
  service_data: {
    num_cores?: number;
    training_on?: string;
    manpower_count?: number;
    service_category?: string;
  };
}

const initialFormData: BusinessEntityFormData = {
  name: '',
  entity_type: 'product',
  service_type: undefined,
  client_id: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  order_value: '',
  payment_duration: '',
  description: '',
  service_data: {}
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
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<BusinessEntity | null>(null);
  const [formData, setFormData] = useState<BusinessEntityFormData>(initialFormData);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [paymentErrorDialog, setPaymentErrorDialog] = useState<{
    open: boolean;
    entityName: string;
    paymentMilestones: Array<{
      id: number;
      amount: number;
      payment_date: string;
      status: string;
      remarks: string;
    }>;
  }>({
    open: false,
    entityName: '',
    paymentMilestones: []
  });

  useEffect(() => {
    fetchEntities();
    fetchClients();
  }, []);

  // Debug: Monitor payment error dialog state
  useEffect(() => {
    console.log('Payment error dialog state changed:', paymentErrorDialog);
  }, [paymentErrorDialog]);

  // Debug: Log when dialog should be rendered
  useEffect(() => {
    if (paymentErrorDialog.open) {
      console.log('Payment error dialog should be open with milestones:', paymentErrorDialog.paymentMilestones);
      console.log('Number of milestones in dialog state:', paymentErrorDialog.paymentMilestones.length);
    }
  }, [paymentErrorDialog.open, paymentErrorDialog.paymentMilestones]);

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
        service_type: entity.service_type,
        client_id: entity.client_id.toString(),
        start_date: entity.start_date,
        end_date: entity.end_date,
        order_value: entity.order_value.toString(),
        payment_duration: entity.payment_duration,
        description: entity.description,
        service_data: {}
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
      const entityData = {
        name: formData.name,
        entity_type: formData.entity_type,
        service_type: formData.entity_type === 'service' ? formData.service_type : undefined,
        client_id: parseInt(formData.client_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        order_value: parseFloat(formData.order_value),
        payment_duration: formData.payment_duration,
        description: formData.description,
        service_data: formData.entity_type === 'service' ? formData.service_data : undefined
      };

      if (selectedEntity) {
        await api.put(`/business/business-entities/${selectedEntity.id}`, entityData);
        showSnackbar('Business entity updated successfully', 'success');
      } else {
        await api.post('/business/business-entities', entityData);
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
    // Show confirmation dialog with warning about purchase orders
    const confirmed = window.confirm(
      `Are you sure you want to delete "${entity.name}"?\n\n` +
      `This will also delete any associated purchase orders, projects, products, and services.\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await api.delete(`/business/business-entities/${entity.id}`);
      
      // Check if there was a warning about purchase orders
      if (response.data.warning) {
        showSnackbar(`${response.data.message} ${response.data.warning}`, 'success');
      } else {
        showSnackbar('Business entity deleted successfully', 'success');
      }
      
      fetchEntities();
    } catch (error: any) {
      console.error('Error deleting business entity:', error);
      console.log('Full error response:', error.response);
      console.log('Error response data:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Failed to delete business entity';
      
      // Check if this is a payment milestone error
      if (error.response?.data?.payment_milestones) {
        console.log('Payment milestones found:', error.response.data.payment_milestones);
        console.log('Number of payment milestones received:', error.response.data.payment_milestones.length);
        console.log('Entity name:', error.response.data.entity_name);
        setPaymentErrorDialog({
          open: true,
          entityName: error.response.data.entity_name,
          paymentMilestones: error.response.data.payment_milestones
        });
      } else {
        console.log('No payment milestones in response, showing error snackbar');
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const handleClosePaymentErrorDialog = () => {
    setPaymentErrorDialog({
      open: false,
      entityName: '',
      paymentMilestones: []
    });
  };

  const handleNavigateToProjects = () => {
    // Navigate to projects page where payment milestones can be managed
    window.location.href = '/business/projects';
  };

  return (
    <Box p={3}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Business Entities</h1>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Add New Entity
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Service Type</TableCell>
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
                <TableCell>{entity.service_type || '-'}</TableCell>
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

      {/* Payment Milestone Error Dialog */}
      <Dialog 
        open={paymentErrorDialog.open} 
        onClose={handleClosePaymentErrorDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Cannot Delete Business Entity
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Cannot delete <strong>"{paymentErrorDialog.entityName}"</strong> because it has payment milestones that must be deleted first.
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 1 }}>
            Payment Milestones ({paymentErrorDialog.paymentMilestones.length}):
          </Typography>
          
          <List sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
            {paymentErrorDialog.paymentMilestones.map((milestone, index) => (
              <React.Fragment key={milestone.id}>
                <ListItem>
                  <ListItemText
                    primary={`Payment Milestone #${milestone.id}`}
                    secondary={
                      <Stack direction="row" spacing={2}>
                        <Typography variant="body2">
                          Amount: ₹{milestone.amount.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Date: {new Date(milestone.payment_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          Status: {milestone.status}
                        </Typography>
                        {milestone.remarks && (
                          <Typography variant="body2">
                            Remarks: {milestone.remarks}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
                {index < paymentErrorDialog.paymentMilestones.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          
          <Typography variant="body2" color="text.secondary">
            Please go to the Projects page to delete these payment milestones before deleting the business entity.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentErrorDialog}>Cancel</Button>
          <Button 
            onClick={handleNavigateToProjects} 
            variant="contained" 
            color="primary"
          >
            Go to Projects
          </Button>
        </DialogActions>
      </Dialog>

      {/* Existing Form Dialog */}
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

            {formData.entity_type === 'service' && (
              <FormControl fullWidth required>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={formData.service_type || ''}
                  label="Service Type"
                  onChange={(e: SelectChangeEvent) => 
                    setFormData({ ...formData, service_type: e.target.value as 'hpc' | 'training' | 'vapt' })}
                >
                  <MenuItem value="hpc">HPC (High Performance Computing)</MenuItem>
                  <MenuItem value="training">Training</MenuItem>
                  <MenuItem value="vapt">VAPT (Vulnerability Assessment & Penetration Testing)</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Service-specific fields */}
            {formData.entity_type === 'service' && formData.service_type === 'hpc' && (
              <TextField
                label="Number of Cores"
                type="number"
                value={formData.service_data.num_cores || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  service_data: {
                    ...formData.service_data,
                    num_cores: parseInt(e.target.value) || undefined
                  }
                })}
                fullWidth
                required
              />
            )}

            {formData.entity_type === 'service' && formData.service_type === 'training' && (
              <TextField
                label="Training Topic"
                value={formData.service_data.training_on || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  service_data: {
                    ...formData.service_data,
                    training_on: e.target.value
                  }
                })}
                fullWidth
                required
              />
            )}

            {formData.entity_type === 'service' && formData.service_type === 'vapt' && (
              <>
                <TextField
                  label="Manpower Count"
                  type="number"
                  value={formData.service_data.manpower_count || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    service_data: {
                      ...formData.service_data,
                      manpower_count: parseInt(e.target.value) || undefined
                    }
                  })}
                  fullWidth
                  required
                />
                <FormControl fullWidth required>
                  <InputLabel>Service Category</InputLabel>
                  <Select
                    value={formData.service_data.service_category || ''}
                    label="Service Category"
                    onChange={(e) => setFormData({
                      ...formData,
                      service_data: {
                        ...formData.service_data,
                        service_category: e.target.value
                      }
                    })}
                  >
                    <MenuItem value="coding">Coding</MenuItem>
                    <MenuItem value="infra">Infrastructure</MenuItem>
                    <MenuItem value="web_application">Web Application</MenuItem>
                    <MenuItem value="mobile_application">Mobile Application</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

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