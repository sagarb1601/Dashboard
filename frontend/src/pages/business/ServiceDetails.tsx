import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Typography, FormControl, InputLabel,
  Select, MenuItem, Tabs, Tab, Grid, Snackbar, Alert
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../utils/api';

interface Service {
  id: number;
  entity_id: number;
  entity_name: string;
  service_type: 'hpc' | 'vapt' | 'training';
  client_name: string;
  start_date: string;
  end_date: string;
  order_value: number;
  group_name: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const PAYMENT_TYPES = [
  'Monthly',
  'Quarterly',
  'Half-yearly',
  'Yearly',
  'One-time',
  'milestone'
];

const ServiceDetails = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form data for each service type
  const [hpcFormData, setHPCFormData] = useState({
    num_cores: '',
    billing_start_date: new Date().toISOString().split('T')[0],
    billing_end_date: new Date().toISOString().split('T')[0],
    payment_type: '',
    order_value: '',
    comments: ''
  });

  const [vaptFormData, setVAPTFormData] = useState({
    billing_start_date: new Date().toISOString().split('T')[0],
    billing_end_date: new Date().toISOString().split('T')[0],
    payment_type: '',
    order_value: '',
    comments: ''
  });

  const [trainingFormData, setTrainingFormData] = useState({
    training_on: '',
    order_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/business/services');
      setServices(response.data);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      showSnackbar('Failed to fetch services', 'error');
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (service: Service) => {
    setSelectedService(service);
    fetchServiceDetails(service);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
    resetFormData();
  };

  const resetFormData = () => {
    setHPCFormData({
      num_cores: '',
      billing_start_date: new Date().toISOString().split('T')[0],
      billing_end_date: new Date().toISOString().split('T')[0],
      payment_type: '',
      order_value: '',
      comments: ''
    });

    setVAPTFormData({
      billing_start_date: new Date().toISOString().split('T')[0],
      billing_end_date: new Date().toISOString().split('T')[0],
      payment_type: '',
      order_value: '',
      comments: ''
    });

    setTrainingFormData({
      training_on: '',
      order_value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    });
  };

  const fetchServiceDetails = async (service: Service) => {
    try {
      const response = await api.get(`/business/services/${service.id}/details?service_type=${service.service_type}`);
      const details = response.data;

      switch (service.service_type) {
        case 'hpc':
          setHPCFormData({
            num_cores: details.num_cores?.toString() || '',
            billing_start_date: details.billing_start_date || new Date().toISOString().split('T')[0],
            billing_end_date: details.billing_end_date || new Date().toISOString().split('T')[0],
            payment_type: details.payment_type || '',
            order_value: details.order_value?.toString() || '',
            comments: details.comments || ''
          });
          break;
        case 'vapt':
          setVAPTFormData({
            billing_start_date: details.billing_start_date || new Date().toISOString().split('T')[0],
            billing_end_date: details.billing_end_date || new Date().toISOString().split('T')[0],
            payment_type: details.payment_type || '',
            order_value: details.order_value?.toString() || '',
            comments: details.comments || ''
          });
          break;
        case 'training':
          setTrainingFormData({
            training_on: details.training_on || '',
            order_value: details.order_value?.toString() || '',
            start_date: details.start_date || new Date().toISOString().split('T')[0],
            end_date: details.end_date || new Date().toISOString().split('T')[0]
          });
          break;
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      showSnackbar('Failed to fetch service details', 'error');
    }
  };

  const validateHPCForm = () => {
    if (!hpcFormData.num_cores || !hpcFormData.payment_type || !hpcFormData.order_value) {
      showSnackbar('Please fill in all required fields', 'error');
      return false;
    }
    if (new Date(hpcFormData.billing_end_date) < new Date(hpcFormData.billing_start_date)) {
      showSnackbar('End date must be after start date', 'error');
      return false;
    }
    return true;
  };

  const validateVAPTForm = () => {
    if (!vaptFormData.payment_type || !vaptFormData.order_value) {
      showSnackbar('Please fill in all required fields', 'error');
      return false;
    }
    if (new Date(vaptFormData.billing_end_date) < new Date(vaptFormData.billing_start_date)) {
      showSnackbar('End date must be after start date', 'error');
      return false;
    }
    return true;
  };

  const validateTrainingForm = () => {
    if (!trainingFormData.training_on || !trainingFormData.order_value) {
      showSnackbar('Please fill in all required fields', 'error');
      return false;
    }
    if (new Date(trainingFormData.end_date) < new Date(trainingFormData.start_date)) {
      showSnackbar('End date must be after start date', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedService) return;

    try {
      let isValid = false;
      let submitData;

      switch (selectedService.service_type) {
        case 'hpc':
          isValid = validateHPCForm();
          submitData = {
            ...hpcFormData,
            num_cores: parseInt(hpcFormData.num_cores),
            order_value: parseFloat(hpcFormData.order_value)
          };
          break;
        case 'vapt':
          isValid = validateVAPTForm();
          submitData = {
            ...vaptFormData,
            order_value: parseFloat(vaptFormData.order_value)
          };
          break;
        case 'training':
          isValid = validateTrainingForm();
          submitData = {
            ...trainingFormData,
            order_value: parseFloat(trainingFormData.order_value)
          };
          break;
        default:
          return;
      }

      if (!isValid) return;

      await api.post(
        `/business/services/${selectedService.id}/details?service_type=${selectedService.service_type}`,
        submitData
      );

      showSnackbar('Service details saved successfully', 'success');
      handleCloseDialog();
      fetchServices();
    } catch (error) {
      console.error('Error saving service details:', error);
      showSnackbar('Failed to save service details', 'error');
    }
  };

  const renderHPCForm = () => (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        label="Number of Cores"
        type="number"
        value={hpcFormData.num_cores}
        onChange={(e) => setHPCFormData({ ...hpcFormData, num_cores: e.target.value })}
        fullWidth
        required
      />

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Billing Start Date"
          value={new Date(hpcFormData.billing_start_date)}
          onChange={(date) => date && setHPCFormData({
            ...hpcFormData,
            billing_start_date: date.toISOString().split('T')[0]
          })}
        />

        <DatePicker
          label="Billing End Date"
          value={new Date(hpcFormData.billing_end_date)}
          onChange={(date) => date && setHPCFormData({
            ...hpcFormData,
            billing_end_date: date.toISOString().split('T')[0]
          })}
        />
      </LocalizationProvider>

      <FormControl fullWidth required>
        <InputLabel>Payment Type</InputLabel>
        <Select
          value={hpcFormData.payment_type}
          onChange={(e) => setHPCFormData({ ...hpcFormData, payment_type: e.target.value })}
          label="Payment Type"
        >
          {PAYMENT_TYPES.filter(type => type !== 'milestone').map(type => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Order Value"
        type="number"
        value={hpcFormData.order_value}
        onChange={(e) => setHPCFormData({ ...hpcFormData, order_value: e.target.value })}
        fullWidth
        required
        InputProps={{
          startAdornment: <Typography>₹</Typography>
        }}
      />

      <TextField
        label="Comments"
        value={hpcFormData.comments}
        onChange={(e) => setHPCFormData({ ...hpcFormData, comments: e.target.value })}
        fullWidth
        multiline
        rows={3}
      />
    </Box>
  );

  const renderVAPTForm = () => (
    <Box display="flex" flexDirection="column" gap={2}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Billing Start Date"
          value={new Date(vaptFormData.billing_start_date)}
          onChange={(date) => date && setVAPTFormData({
            ...vaptFormData,
            billing_start_date: date.toISOString().split('T')[0]
          })}
        />

        <DatePicker
          label="Billing End Date"
          value={new Date(vaptFormData.billing_end_date)}
          onChange={(date) => date && setVAPTFormData({
            ...vaptFormData,
            billing_end_date: date.toISOString().split('T')[0]
          })}
        />
      </LocalizationProvider>

      <FormControl fullWidth required>
        <InputLabel>Payment Type</InputLabel>
        <Select
          value={vaptFormData.payment_type}
          onChange={(e) => setVAPTFormData({ ...vaptFormData, payment_type: e.target.value })}
          label="Payment Type"
        >
          {PAYMENT_TYPES.map(type => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Order Value"
        type="number"
        value={vaptFormData.order_value}
        onChange={(e) => setVAPTFormData({ ...vaptFormData, order_value: e.target.value })}
        fullWidth
        required
        InputProps={{
          startAdornment: <Typography>₹</Typography>
        }}
      />

      <TextField
        label="Comments"
        value={vaptFormData.comments}
        onChange={(e) => setVAPTFormData({ ...vaptFormData, comments: e.target.value })}
        fullWidth
        multiline
        rows={3}
      />
    </Box>
  );

  const renderTrainingForm = () => (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        label="Training Topic"
        value={trainingFormData.training_on}
        onChange={(e) => setTrainingFormData({ ...trainingFormData, training_on: e.target.value })}
        fullWidth
        required
      />

      <TextField
        label="Order Value"
        type="number"
        value={trainingFormData.order_value}
        onChange={(e) => setTrainingFormData({ ...trainingFormData, order_value: e.target.value })}
        fullWidth
        required
        InputProps={{
          startAdornment: <Typography>₹</Typography>
        }}
      />

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Start Date"
          value={new Date(trainingFormData.start_date)}
          onChange={(date) => date && setTrainingFormData({
            ...trainingFormData,
            start_date: date.toISOString().split('T')[0]
          })}
        />

        <DatePicker
          label="End Date"
          value={new Date(trainingFormData.end_date)}
          onChange={(date) => date && setTrainingFormData({
            ...trainingFormData,
            end_date: date.toISOString().split('T')[0]
          })}
        />
      </LocalizationProvider>
    </Box>
  );

  const renderServiceTable = (serviceType: 'hpc' | 'vapt' | 'training') => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Entity Name</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Technical Group</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Order Value</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services
            .filter(service => service.service_type === serviceType)
            .map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.entity_name}</TableCell>
                <TableCell>{service.client_name}</TableCell>
                <TableCell>{service.group_name}</TableCell>
                <TableCell>{new Date(service.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(service.end_date).toLocaleDateString()}</TableCell>
                <TableCell>₹{service.order_value.toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(service)} size="small">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Service Details</Typography>
      </Box>

      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="HPC Services" />
        <Tab label="VAPT Services" />
        <Tab label="Training Services" />
      </Tabs>

      <TabPanel value={selectedTab} index={0}>
        {renderServiceTable('hpc')}
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        {renderServiceTable('vapt')}
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        {renderServiceTable('training')}
      </TabPanel>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit {selectedService?.service_type.toUpperCase()} Service Details
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            {selectedService?.service_type === 'hpc' && renderHPCForm()}
            {selectedService?.service_type === 'vapt' && renderVAPTForm()}
            {selectedService?.service_type === 'training' && renderTrainingForm()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save
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

export default ServiceDetails; 