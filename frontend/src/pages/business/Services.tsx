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
  Snackbar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AttachMoney as PaymentIcon,
  Receipt as PurchaseOrderIcon
} from '@mui/icons-material';
import api from '../../utils/api';

interface BusinessEntity {
  id: number;
  name: string;
  entity_type: 'product' | 'project' | 'service';
  start_date: string;
  end_date: string;
  order_value: number;
  client_name: string;
}

interface Service {
  id: number;
  entity_id: number;
  entity_name: string;
  start_date: string;
  end_date: string;
  order_value: number;
  client_name: string;
  service_type: 'HPC' | 'Training' | 'VAPT';
  // HPC specific fields
  hpc_cores?: number;
  hpc_billing_start?: string;
  hpc_billing_end?: string;
  // Training specific fields
  training_topic?: string;
  // VAPT specific fields
  vapt_billing_start?: string;
  vapt_billing_end?: string;
}

interface PaymentMilestone {
  id: number;
  entity_id: number;
  po_id: number;
  payment_date: string;
  amount: number;
  status: string;
  remarks: string;
  invoice_no: string;
  invoice_value: number;
}

interface PurchaseOrder {
  po_id: number;
  entity_id: number;
  invoice_no: string;
  invoice_date: string;
  invoice_value: number;
  payment_duration: string;
  invoice_status: string;
  requested_by: number;
  requested_by_name: string;
  payment_mode: string;
  remarks: string;
}

interface FormData {
  entity_id: string;
  service_type: 'HPC' | 'Training' | 'VAPT' | '';
  // Common fields for all service types
  start_date: string;
  end_date: string;
  // HPC fields
  num_cores: string;
  billing_start_date: string;
  billing_end_date: string;
  // Training fields
  training_on: string;
  // VAPT fields
  vapt_billing_start: string;
  vapt_billing_end: string;
}

interface FormErrors {
  entity_id?: string;
  service_type?: string;
  num_cores?: string;
  billing_start_date?: string;
  billing_end_date?: string;
  start_date?: string;
  end_date?: string;
  training_on?: string;
  vapt_billing_start?: string;
  vapt_billing_end?: string;
}

const initialFormData: FormData = {
  entity_id: '',
  service_type: '',
  num_cores: '',
  billing_start_date: new Date().toISOString().split('T')[0],
  billing_end_date: new Date().toISOString().split('T')[0],
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  training_on: '',
  vapt_billing_start: new Date().toISOString().split('T')[0],
  vapt_billing_end: new Date().toISOString().split('T')[0]
};

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Payment milestone dialog states
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedServiceForPayment, setSelectedServiceForPayment] = useState<Service | null>(null);
  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    status: 'pending',
    remarks: '',
    po_id: ''
  });

  // Details dialog states
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<Service | null>(null);

  // Add state for editing payment milestones
  const [selectedPayment, setSelectedPayment] = useState<PaymentMilestone | null>(null);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    
    if (!formData.entity_id) {
      errors.entity_id = 'Business Entity is required';
    }
    
    if (!formData.service_type) {
      errors.service_type = 'Service Type is required';
    }
    
    // Common validation for all service types
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    
    if (formData.service_type === 'HPC') {
      if (!formData.num_cores) {
        errors.num_cores = 'Number of cores is required';
      } else if (isNaN(parseInt(formData.num_cores)) || parseInt(formData.num_cores) <= 0) {
        errors.num_cores = 'Number of cores must be a positive number';
      }
      if (!formData.billing_start_date) {
        errors.billing_start_date = 'Billing start date is required';
      }
      if (!formData.billing_end_date) {
        errors.billing_end_date = 'Billing end date is required';
      }
    }
    
    if (formData.service_type === 'Training') {
      if (!formData.training_on) {
        errors.training_on = 'Training topic is required';
      }
    }
    
    if (formData.service_type === 'VAPT') {
      if (!formData.vapt_billing_start) {
        errors.vapt_billing_start = 'Billing start date is required';
      }
      if (!formData.vapt_billing_end) {
        errors.vapt_billing_end = 'Billing end date is required';
      }
    }
    
    return errors;
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
      setEntities(response.data);
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
    console.log('handleSubmit called with formData:', formData);
    
    // Validate form
    const errors = validateForm();
    console.log('Validation errors:', errors);
    setFormErrors(errors);
    
    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      console.log('Form validation failed, not submitting');
      return;
    }

    try {
      const serviceData: any = {
        start_date: formData.start_date,
        end_date: formData.end_date
      };
      
      if (formData.service_type === 'HPC') {
        serviceData.num_cores = parseInt(formData.num_cores);
        serviceData.billing_start_date = formData.billing_start_date;
        serviceData.billing_end_date = formData.billing_end_date;
      } else if (formData.service_type === 'Training') {
        serviceData.training_on = formData.training_on;
      } else if (formData.service_type === 'VAPT') {
        serviceData.billing_start_date = formData.vapt_billing_start;
        serviceData.billing_end_date = formData.vapt_billing_end;
      }

      const submitData = {
        entity_id: parseInt(formData.entity_id),
        service_type: formData.service_type,
        service_data: serviceData
      };

      console.log('Submitting data:', submitData);

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

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        entity_id: service.entity_id.toString(),
        service_type: service.service_type,
        num_cores: service.hpc_cores?.toString() || '',
        billing_start_date: service.hpc_billing_start || new Date().toISOString().split('T')[0],
        billing_end_date: service.hpc_billing_end || new Date().toISOString().split('T')[0],
        start_date: service.start_date,
        end_date: service.end_date,
        training_on: service.training_topic || '',
        vapt_billing_start: service.vapt_billing_start || new Date().toISOString().split('T')[0],
        vapt_billing_end: service.vapt_billing_end || new Date().toISOString().split('T')[0]
      });
    } else {
      setSelectedService(null);
      setFormData(initialFormData);
    }
    setActiveStep(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
    setFormData(initialFormData);
    setFormErrors({});
    setActiveStep(0);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleOpenPaymentDialog = async (service: Service) => {
    setSelectedServiceForPayment(service);
    try {
      const [milestonesResponse, purchaseOrdersResponse] = await Promise.all([
        api.get(`/business/services/${service.id}/payment-milestones`),
        api.get(`/business/services/${service.id}/purchase-orders`)
      ]);
      setPaymentMilestones(milestonesResponse.data);
      setPurchaseOrders(purchaseOrdersResponse.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      showSnackbar('Failed to fetch payment data', 'error');
    }
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedServiceForPayment(null);
    setPaymentMilestones([]);
    setPurchaseOrders([]);
    setPaymentFormData({
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'pending',
      remarks: '',
      po_id: ''
    });
  };

  const handleEditPayment = (milestone: PaymentMilestone) => {
    setSelectedPayment(milestone);
    setPaymentFormData({
      payment_date: milestone.payment_date,
      amount: milestone.amount.toString(),
      status: milestone.status,
      remarks: milestone.remarks,
      po_id: milestone.po_id.toString()
    });
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!selectedServiceForPayment) return;
    if (!window.confirm('Are you sure you want to delete this payment milestone?')) return;
    try {
      await api.delete(`/business/services/${selectedServiceForPayment.id}/payment-milestones/${paymentId}`);
      showSnackbar('Payment milestone deleted successfully', 'success');
      // Refresh payment milestones
      const response = await api.get(`/business/services/${selectedServiceForPayment.id}/payment-milestones`);
      setPaymentMilestones(response.data);
      setSelectedPayment(null);
      setPaymentFormData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'pending',
        remarks: '',
        po_id: ''
      });
    } catch (error) {
      console.error('Error deleting payment milestone:', error);
      showSnackbar('Failed to delete payment milestone', 'error');
    }
  };

  const handleAddPaymentMilestone = async () => {
    if (!selectedServiceForPayment || !paymentFormData.po_id || !paymentFormData.amount) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }
    try {
      if (selectedPayment) {
        // Edit mode
        await api.put(`/business/services/${selectedServiceForPayment.id}/payment-milestones/${selectedPayment.id}`, {
          ...paymentFormData,
          amount: parseFloat(paymentFormData.amount),
          po_id: parseInt(paymentFormData.po_id)
        });
        showSnackbar('Payment milestone updated successfully', 'success');
      } else {
        // Add mode
        await api.post(`/business/services/${selectedServiceForPayment.id}/payment-milestones`, {
          ...paymentFormData,
          amount: parseFloat(paymentFormData.amount),
          po_id: parseInt(paymentFormData.po_id)
        });
        showSnackbar('Payment milestone added successfully', 'success');
      }
      // Refresh payment milestones
      const response = await api.get(`/business/services/${selectedServiceForPayment.id}/payment-milestones`);
      setPaymentMilestones(response.data);
      // Reset form
      setPaymentFormData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'pending',
        remarks: '',
        po_id: ''
      });
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error saving payment milestone:', error);
      showSnackbar('Failed to save payment milestone', 'error');
    }
  };

  const handleOpenDetailsDialog = async (service: Service) => {
    setSelectedServiceForDetails(service);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedServiceForDetails(null);
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'HPC': return 'primary';
      case 'Training': return 'secondary';
      case 'VAPT': return 'success';
      default: return 'default';
    }
  };

  const getServiceSpecificInfo = (service: Service) => {
    switch (service.service_type) {
      case 'HPC':
        return `Cores: ${service.hpc_cores}`;
      case 'Training':
        return `Topic: ${service.training_topic}`;
      case 'VAPT':
        return 'VAPT Service';
      default:
        return '';
    }
  };

  const steps = ['Basic Information', 'Service Details'];

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">BD Services</Typography>
        {/* <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Add New Service
        </Button> */}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Order Value</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.entity_name}</TableCell>
                <TableCell>{service.service_type}</TableCell>
                <TableCell>{service.client_name}</TableCell>
                <TableCell>{new Date(service.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(service.end_date).toLocaleDateString()}</TableCell>
                <TableCell>₹{service.order_value?.toLocaleString() || '0'}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenPaymentDialog(service)}>
                    <PaymentIcon />
                  </IconButton>
                  <IconButton color="info" onClick={() => handleOpenDetailsDialog(service)}>
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">No services found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Service Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedService ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl fullWidth required error={!!formErrors.entity_id}>
                  <InputLabel>Business Entity</InputLabel>
                  <Select
                    value={formData.entity_id}
                    label="Business Entity"
                    onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                  >
                    {entities
                      .filter(entity => entity.entity_type === 'service')
                      .map((entity) => (
                        <MenuItem key={entity.id} value={entity.id.toString()}>
                          {entity.name}
                        </MenuItem>
                      ))}
                  </Select>
                  {formErrors.entity_id && (
                    <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                      {formErrors.entity_id}
                    </Typography>
                  )}
                </FormControl>

                <FormControl fullWidth required error={!!formErrors.service_type}>
                  <InputLabel>Service Type</InputLabel>
                  <Select
                    value={formData.service_type}
                    label="Service Type"
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      service_type: e.target.value as 'HPC' | 'Training' | 'VAPT' 
                    })}
                  >
                    <MenuItem value="HPC">HPC</MenuItem>
                    <MenuItem value="Training">Training</MenuItem>
                    <MenuItem value="VAPT">VAPT</MenuItem>
                  </Select>
                  {formErrors.service_type && (
                    <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                      {formErrors.service_type}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            )}

            {activeStep === 1 && (
              <Box display="flex" flexDirection="column" gap={2}>
                {formData.service_type === 'HPC' && (
                  <>
                    <TextField
                      label="Number of Cores"
                      type="number"
                      value={formData.num_cores}
                      onChange={(e) => setFormData({ ...formData, num_cores: e.target.value })}
                      fullWidth
                      required
                      error={!!formErrors.num_cores}
                      helperText={formErrors.num_cores}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Service Start Date"
                        value={new Date(formData.start_date)}
                        onChange={(date) => date && setFormData({
                          ...formData,
                          start_date: date.toISOString().split('T')[0]
                        })}
                      />
                      <DatePicker
                        label="Service End Date"
                        value={new Date(formData.end_date)}
                        onChange={(date) => date && setFormData({
                          ...formData,
                          end_date: date.toISOString().split('T')[0]
                        })}
                      />
                      <DatePicker
                        label="Billing Start Date"
                        value={new Date(formData.billing_start_date)}
                        onChange={(date) => date && setFormData({
                          ...formData,
                          billing_start_date: date.toISOString().split('T')[0]
                        })}
                      />
                      <DatePicker
                        label="Billing End Date"
                        value={new Date(formData.billing_end_date)}
                        onChange={(date) => date && setFormData({
                          ...formData,
                          billing_end_date: date.toISOString().split('T')[0]
                        })}
                      />
                    </LocalizationProvider>
                  </>
                )}

                {formData.service_type === 'Training' && (
                  <>
                    <TextField
                      label="Training Topic"
                      value={formData.training_on}
                      onChange={(e) => setFormData({ ...formData, training_on: e.target.value })}
                      fullWidth
                      required
                      error={!!formErrors.training_on}
                      helperText={formErrors.training_on}
                    />
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
                  </>
                )}

                {formData.service_type === 'VAPT' && (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Service Start Date"
                      value={new Date(formData.start_date)}
                      onChange={(date) => date && setFormData({
                        ...formData,
                        start_date: date.toISOString().split('T')[0]
                      })}
                    />
                    <DatePicker
                      label="Service End Date"
                      value={new Date(formData.end_date)}
                      onChange={(date) => date && setFormData({
                        ...formData,
                        end_date: date.toISOString().split('T')[0]
                      })}
                    />
                    <DatePicker
                      label="Billing Start Date"
                      value={new Date(formData.vapt_billing_start)}
                      onChange={(date) => date && setFormData({
                        ...formData,
                        vapt_billing_start: date.toISOString().split('T')[0]
                      })}
                    />
                    <DatePicker
                      label="Billing End Date"
                      value={new Date(formData.vapt_billing_end)}
                      onChange={(date) => date && setFormData({
                        ...formData,
                        vapt_billing_end: date.toISOString().split('T')[0]
                      })}
                    />
                  </LocalizationProvider>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {activeStep > 0 && (
            <Button onClick={handleBack}>Back</Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained">Next</Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {selectedService ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Payment Milestones Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Payment Milestones - {selectedServiceForPayment?.entity_name}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Add Payment Milestone</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControl fullWidth>
                    <InputLabel>Purchase Order</InputLabel>
                    <Select
                      value={paymentFormData.po_id}
                      label="Purchase Order"
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, po_id: e.target.value })}
                    >
                      {purchaseOrders.map((po) => (
                        <MenuItem key={po.po_id} value={po.po_id.toString()}>
                          {po.invoice_no} - ₹{po.invoice_value.toLocaleString()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Payment Date"
                      value={new Date(paymentFormData.payment_date)}
                      onChange={(date) => date && setPaymentFormData({
                        ...paymentFormData,
                        payment_date: date.toISOString().split('T')[0]
                      })}
                    />
                  </LocalizationProvider>

                  <TextField
                    label="Amount"
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: <Typography>₹</Typography>
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={paymentFormData.status}
                      label="Status"
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, status: e.target.value })}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Remarks"
                    value={paymentFormData.remarks}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, remarks: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />

                  <Button onClick={handleAddPaymentMilestone} variant="contained" color="primary">
                    {selectedPayment ? 'Update' : 'Add'} Milestone
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Existing Milestones</Typography>
                <Box maxHeight={400} overflow="auto">
                  {paymentMilestones.map((milestone) => (
                    <Card key={milestone.id} sx={{ mb: 1, position: 'relative' }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="body2">
                          <strong>Date:</strong> {new Date(milestone.payment_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Amount:</strong> ₹{milestone.amount.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong> {milestone.status}
                        </Typography>
                        {milestone.remarks && (
                          <Typography variant="body2">
                            <strong>Remarks:</strong> {milestone.remarks}
                          </Typography>
                        )}
                        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary" onClick={() => handleEditPayment(milestone)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeletePayment(milestone.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Service Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Service Details - {selectedServiceForDetails?.entity_name}
        </DialogTitle>
        <DialogContent>
          {selectedServiceForDetails && (
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Service Type</Typography>
                  <Typography variant="body1">
                    <Chip 
                      label={selectedServiceForDetails.service_type} 
                      color={getServiceTypeColor(selectedServiceForDetails.service_type)}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Client</Typography>
                  <Typography variant="body1">{selectedServiceForDetails.client_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Start Date</Typography>
                  <Typography variant="body1">
                    {new Date(selectedServiceForDetails.start_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">End Date</Typography>
                  <Typography variant="body1">
                    {new Date(selectedServiceForDetails.end_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Order Value</Typography>
                  <Typography variant="body1">
                    ₹{selectedServiceForDetails.order_value?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Service Details</Typography>
                  <Typography variant="body1">
                    {getServiceSpecificInfo(selectedServiceForDetails)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
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

export default Services; 