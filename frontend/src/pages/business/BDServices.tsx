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
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../utils/api';

interface Service {
  id: number;
  entity_id: number;
  entity_name: string;
  client_name: string;
  order_value: number;
  service_type: 'hpc' | 'vapt' | 'training';
  start_date: string;
  end_date: string;
  // HPC specific fields
  hpc_cores?: number;
  // Training specific fields
  training_topic?: string;
  // VAPT specific fields
  vapt_manpower?: number;
  vapt_category?: string;
}

interface BusinessEntity {
  id: number;
  name: string;
  entity_type: 'product' | 'project' | 'service';
  service_type?: 'hpc' | 'training' | 'vapt';
  client_name: string;
  order_value: number;
}

interface PaymentMilestone {
  id: number;
  entity_id: number;
  po_id: number;
  payment_date: string;
  amount: number;
  status: 'received' | 'pending';
  remarks: string;
  billing_start_date: string;
  billing_end_date: string;
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

interface PaymentFormData {
  payment_date: string;
  amount: string;
  status: 'received' | 'pending';
  remarks: string;
  po_id: string;
  billing_start_date: string;
  billing_end_date: string;
}

const initialPaymentFormData: PaymentFormData = {
  payment_date: new Date().toISOString().split('T')[0],
  amount: '',
  status: 'pending',
  remarks: '',
  po_id: '',
  billing_start_date: new Date().toISOString().split('T')[0],
  billing_end_date: new Date().toISOString().split('T')[0]
};

const BDServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [servicesWithPurchaseOrders, setServicesWithPurchaseOrders] = useState<Set<number>>(new Set());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Payment milestone states
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedServiceForPayment, setSelectedServiceForPayment] = useState<Service | null>(null);
  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>(initialPaymentFormData);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMilestone | null>(null);

  // Service details states
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<Service | null>(null);

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
      
      // Check which services have purchase orders
      const servicesWithPOs = new Set<number>();
      for (const service of response.data) {
        try {
          const poResponse = await api.get(`/business/services/${service.id}/purchase-orders`);
          if (poResponse.data && poResponse.data.length > 0) {
            servicesWithPOs.add(service.id);
          }
        } catch (error) {
          console.error(`Error checking purchase orders for service ${service.id}:`, error);
        }
      }
      setServicesWithPurchaseOrders(servicesWithPOs);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch services';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const response = await api.get('/business/business-entities');
      setEntities(response.data.filter((entity: BusinessEntity) => entity.entity_type === 'service'));
    } catch (error: any) {
      console.error('Error fetching entities:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch entities';
      showSnackbar(errorMessage, 'error');
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchEntities();
  }, [fetchServices, fetchEntities]);

  // Payment milestone handlers
  const handlePaymentMilestones = async (service: Service) => {
    try {
      // First check if purchase orders exist
      const purchaseOrdersResponse = await api.get(`/business/services/${service.id}/purchase-orders`);
      
      if (!purchaseOrdersResponse.data || purchaseOrdersResponse.data.length === 0) {
        showSnackbar('No purchase orders found for this service. Please add purchase orders first.', 'error');
        return;
      }
      
      // If purchase orders exist, proceed with opening the dialog
      setSelectedServiceForPayment(service);
      const [milestonesResponse] = await Promise.all([
        api.get(`/business/services/${service.id}/payment-milestones`)
      ]);
      setPaymentMilestones(milestonesResponse.data);
      setPurchaseOrders(purchaseOrdersResponse.data);
      setOpenPaymentDialog(true);
    } catch (error: any) {
      console.error('Error checking purchase orders:', error);
      showSnackbar('Failed to check purchase orders', 'error');
    }
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedServiceForPayment(null);
    setPaymentMilestones([]);
    setPurchaseOrders([]);
    setPaymentFormData(initialPaymentFormData);
    setSelectedPayment(null);
  };

  const handleEditPayment = (milestone: PaymentMilestone) => {
    setSelectedPayment(milestone);
    setPaymentFormData({
      payment_date: milestone.payment_date,
      amount: milestone.amount.toString(),
      status: milestone.status,
      remarks: milestone.remarks,
      po_id: milestone.po_id.toString(),
      billing_start_date: milestone.billing_start_date,
      billing_end_date: milestone.billing_end_date
    });
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!selectedServiceForPayment) return;
    if (!window.confirm('Are you sure you want to delete this payment milestone?')) return;

    try {
      await api.delete(`/business/services/${selectedServiceForPayment.id}/payment-milestones/${paymentId}`);
      showSnackbar('Payment milestone deleted successfully', 'success');
      const response = await api.get(`/business/services/${selectedServiceForPayment.id}/payment-milestones`);
      setPaymentMilestones(response.data);
      
      // Refresh the main services data to update totals
      fetchServices();
    } catch (error: any) {
      console.error('Error deleting payment milestone:', error);
      showSnackbar('Failed to delete payment milestone', 'error');
    }
  };

  const handleAddPaymentMilestone = async () => {
    if (!selectedServiceForPayment) return;

    try {
      const submitData = {
        ...paymentFormData,
        amount: parseFloat(paymentFormData.amount),
        po_id: parseInt(paymentFormData.po_id)
      };

      if (selectedPayment) {
        await api.put(`/business/services/${selectedServiceForPayment.id}/payment-milestones/${selectedPayment.id}`, submitData);
        showSnackbar('Payment milestone updated successfully', 'success');
      } else {
        await api.post(`/business/services/${selectedServiceForPayment.id}/payment-milestones`, submitData);
        showSnackbar('Payment milestone added successfully', 'success');
      }

      const response = await api.get(`/business/services/${selectedServiceForPayment.id}/payment-milestones`);
      setPaymentMilestones(response.data);
      setPaymentFormData(initialPaymentFormData);
      setSelectedPayment(null);
      
      // Refresh the main services data to update totals
      fetchServices();
    } catch (error: any) {
      console.error('Error saving payment milestone:', error);
      showSnackbar('Failed to save payment milestone', 'error');
    }
  };

  // Service details handlers
  const handleOpenDetailsDialog = async (service: Service) => {
    setSelectedServiceForDetails(service);
    try {
      const [milestonesResponse, purchaseOrdersResponse] = await Promise.all([
        api.get(`/business/services/${service.id}/payment-milestones`),
        api.get(`/business/services/${service.id}/purchase-orders`)
      ]);
      setPaymentMilestones(milestonesResponse.data);
      setPurchaseOrders(purchaseOrdersResponse.data);
    } catch (error: any) {
      console.error('Error fetching service details:', error);
      showSnackbar('Failed to fetch service details', 'error');
    }
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedServiceForDetails(null);
    setPaymentMilestones([]);
    setPurchaseOrders([]);
  };

  const handleViewDetails = (service: Service) => {
    setSelectedServiceForDetails(service);
    setOpenDetailsDialog(true);
  };

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'hpc': return 'primary' as const;
      case 'training': return 'secondary' as const;
      case 'vapt': return 'info' as const;
      default: return 'default' as const;
    }
  };

  const getServiceSpecificInfo = (service: Service) => {
    switch (service.service_type) {
      case 'hpc':
        return `Cores: ${service.hpc_cores || 'N/A'}`;
      case 'training':
        return `Topic: ${service.training_topic || 'N/A'}`;
      case 'vapt':
        return `Manpower: ${service.vapt_manpower || 'N/A'}, Category: ${service.vapt_category || 'N/A'}`;
      default:
        return 'N/A';
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">BD Services</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      ) : (
        <Paper className="overflow-hidden">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service Name</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Service Type</TableCell>
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
                    <TableCell>{service.client_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={service.service_type?.toUpperCase()} 
                        color={getServiceTypeColor(service.service_type || '')} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{new Date(service.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(service.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{service.order_value.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="row" gap={1}>
                        <Tooltip title={servicesWithPurchaseOrders.has(service.id) ? "Add Payment Milestone" : "No purchase orders found. Add purchase orders first."}>
                          <span>
                            <IconButton
                              onClick={() => handlePaymentMilestones(service)}
                              size="small"
                              color="primary"
                              disabled={!servicesWithPurchaseOrders.has(service.id)}
                            >
                              <AddIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => handleViewDetails(service)}
                            size="small"
                            color="info"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Payment Milestone Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Payment Milestones - {selectedServiceForPayment?.entity_name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Add/Edit Milestone</Typography>
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
                  
                  <DatePicker
                    label="Billing Start Date"
                    value={new Date(paymentFormData.billing_start_date)}
                    onChange={(date) => date && setPaymentFormData({
                      ...paymentFormData,
                      billing_start_date: date.toISOString().split('T')[0]
                    })}
                  />
                  
                  <DatePicker
                    label="Billing End Date"
                    value={new Date(paymentFormData.billing_end_date)}
                    onChange={(date) => date && setPaymentFormData({
                      ...paymentFormData,
                      billing_end_date: date.toISOString().split('T')[0]
                    })}
                  />
                </LocalizationProvider>

                <TextField
                  label="Amount"
                  type="number"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={paymentFormData.status}
                    label="Status"
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, status: e.target.value as 'received' | 'pending' })}
                  >
                    <MenuItem value="received">Received</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
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

                <Button
                  variant="contained"
                  onClick={handleAddPaymentMilestone}
                  fullWidth
                >
                  {selectedPayment ? 'Update Milestone' : 'Add Milestone'}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Payment Milestones</Typography>
              <Box display="flex" flexDirection="column" gap={2} maxHeight={400} overflow="auto">
                {paymentMilestones.map((milestone) => (
                  <Card key={milestone.id} variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2">
                          ₹{milestone.amount.toLocaleString()}
                        </Typography>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditPayment(milestone)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeletePayment(milestone.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Date: {new Date(milestone.payment_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Status: {milestone.status}
                      </Typography>
                      {milestone.remarks && (
                        <Typography variant="body2" color="textSecondary">
                          Remarks: {milestone.remarks}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {paymentMilestones.length === 0 && (
                  <Typography color="textSecondary" textAlign="center">
                    No payment milestones found
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Service Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Service Details - {selectedServiceForDetails?.entity_name}
        </DialogTitle>
        <DialogContent>
          {selectedServiceForDetails && (
            <Box mt={2}>
              {/* Service Summary */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" mb={2}>Service Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Order Value</Typography>
                    <Typography variant="h6">₹{selectedServiceForDetails.order_value.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Total Received</Typography>
                    <Typography variant="h6" color="success.main">
                      ₹{paymentMilestones
                        .filter(milestone => milestone.status === 'received')
                        .reduce((sum, milestone) => sum + Number(milestone.amount), 0)
                        .toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Remaining</Typography>
                    <Typography variant="h6" color="warning.main">
                      ₹{(selectedServiceForDetails.order_value - 
                        paymentMilestones
                          .filter(milestone => milestone.status === 'received')
                          .reduce((sum, milestone) => sum + Number(milestone.amount), 0)
                      ).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Progress</Typography>
                    <Typography variant="h6">
                      {selectedServiceForDetails.order_value ? 
                        Math.round((
                          paymentMilestones
                            .filter(milestone => milestone.status === 'received')
                            .reduce((sum, milestone) => sum + Number(milestone.amount), 0) / 
                          selectedServiceForDetails.order_value
                        ) * 100) : 0}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Service Information */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" mb={2}>Service Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Service Name</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedServiceForDetails.entity_name}</Typography>
                    
                    <Typography variant="body2" color="textSecondary">Client</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedServiceForDetails.client_name}</Typography>
                    
                    <Typography variant="body2" color="textSecondary">Service Type</Typography>
                    <Chip 
                      label={selectedServiceForDetails.service_type?.toUpperCase() || 'N/A'} 
                      color={getServiceTypeColor(selectedServiceForDetails.service_type || '')}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Service Details</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{getServiceSpecificInfo(selectedServiceForDetails)}</Typography>
                    
                    <Typography variant="body2" color="textSecondary">Start Date</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{new Date(selectedServiceForDetails.start_date).toLocaleDateString()}</Typography>
                    
                    <Typography variant="body2" color="textSecondary">End Date</Typography>
                    <Typography variant="body1">{new Date(selectedServiceForDetails.end_date).toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Purchase Orders */}
              <Typography variant="h6" mb={2}>Purchase Orders</Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice No</TableCell>
                      <TableCell>Invoice Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.po_id}>
                        <TableCell>{po.invoice_no}</TableCell>
                        <TableCell>{new Date(po.invoice_date).toLocaleDateString()}</TableCell>
                        <TableCell>₹{po.invoice_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: 
                                po.invoice_status === 'Paid' ? '#e8f5e9' :
                                po.invoice_status === 'Approved' ? '#e3f2fd' :
                                po.invoice_status === 'Rejected' ? '#ffebee' : '#fff3e0',
                              color: 
                                po.invoice_status === 'Paid' ? '#2e7d32' :
                                po.invoice_status === 'Approved' ? '#1565c0' :
                                po.invoice_status === 'Rejected' ? '#c62828' : '#f57c00'
                            }}
                          >
                            {po.invoice_status}
                          </Typography>
                        </TableCell>
                        <TableCell>{po.requested_by_name}</TableCell>
                      </TableRow>
                    ))}
                    {purchaseOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">No purchase orders found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Payment Milestones */}
              <Typography variant="h6" mb={2}>Payment Milestones</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentMilestones.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: 
                                payment.status === 'received' ? '#e8f5e9' : '#fff3e0',
                              color: 
                                payment.status === 'received' ? '#2e7d32' : '#f57c00'
                            }}
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Typography>
                        </TableCell>
                        <TableCell>{payment.remarks}</TableCell>
                      </TableRow>
                    ))}
                    {paymentMilestones.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="textSecondary">No payment milestones found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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
    </div>
  );
};

export default BDServices; 