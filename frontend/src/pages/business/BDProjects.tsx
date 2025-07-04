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
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
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
  start_date: string;
  end_date: string;
  order_value: number;
  extended_date: string | null;
  has_purchase_orders?: boolean;
  total_received?: number;
}

interface PurchaseOrder {
  po_id: number;
  invoice_no: string;
  invoice_date: string;
  invoice_value: number;
  invoice_status: string;
  requested_by_name: string;
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
}

const BDProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [projectsWithPurchaseOrders, setProjectsWithPurchaseOrders] = useState<Set<number>>(new Set());
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMilestone | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: null as Date | null,
    amount: '',
    status: 'pending' as 'received' | 'pending',
    remarks: '',
    po_id: '' as string,
    billing_start_date: null as Date | null,
    billing_end_date: null as Date | null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/business/projects');
      const projects = response.data;
      
      // Calculate total received amount for each project and check for purchase orders
      const projectsWithTotals = await Promise.all(
        projects.map(async (project: Project) => {
          try {
            const milestonesResponse = await api.get(`/business/projects/${project.id}/payment-milestones`);
            const milestones = milestonesResponse.data;
            const totalReceived = milestones
              .filter((milestone: PaymentMilestone) => milestone.status === 'received')
              .reduce((sum: number, milestone: PaymentMilestone) => sum + Number(milestone.amount), 0);
            
            return {
              ...project,
              total_received: totalReceived
            };
          } catch (error) {
            console.error(`Error fetching milestones for project ${project.id}:`, error);
            return {
              ...project,
              total_received: 0
            };
          }
        })
      );
      
      setProjects(projectsWithTotals);
      
      // Check which projects have purchase orders
      const projectsWithPOs = new Set<number>();
      for (const project of projectsWithTotals) {
        try {
          const poResponse = await api.get(`/business/projects/${project.id}/purchase-orders`);
          if (poResponse.data && poResponse.data.length > 0) {
            projectsWithPOs.add(project.id);
          }
        } catch (error) {
          console.error(`Error checking purchase orders for project ${project.id}:`, error);
        }
      }
      setProjectsWithPurchaseOrders(projectsWithPOs);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showSnackbar('Failed to fetch projects', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchPurchaseOrders = async (projectId: number) => {
    try {
      console.log('Fetching purchase orders for project ID:', projectId);
      const response = await api.get(`/business/projects/${projectId}/purchase-orders`);
      console.log('Purchase orders response:', response.data);
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const handleOpenPaymentDialog = async (project: Project) => {
    try {
      // First check if purchase orders exist
      const purchaseOrdersResponse = await api.get(`/business/projects/${project.id}/purchase-orders`);
      
      if (!purchaseOrdersResponse.data || purchaseOrdersResponse.data.length === 0) {
        showSnackbar('No purchase orders found for this project. Please add purchase orders first.', 'error');
        return;
      }
      
      // If purchase orders exist, proceed with opening the dialog
      setSelectedProject(project);
      setPaymentFormData({
        payment_date: null,
        amount: '',
        status: 'pending',
        remarks: '',
        po_id: '',
        billing_start_date: null,
        billing_end_date: null
      });
      setSelectedPayment(null);
      setOpenPaymentDialog(true);
      fetchPaymentMilestones(project.id);
      setPurchaseOrders(purchaseOrdersResponse.data);
    } catch (error: any) {
      console.error('Error checking purchase orders:', error);
      showSnackbar('Failed to check purchase orders', 'error');
    }
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedProject(null);
    setSelectedPayment(null);
    setPaymentFormData({
      payment_date: null,
      amount: '',
      status: 'pending',
      remarks: '',
      po_id: '',
      billing_start_date: null,
      billing_end_date: null
    });
  };

  const fetchPaymentMilestones = async (projectId: number) => {
    try {
      console.log('Fetching payment milestones for project ID:', projectId);
      const response = await api.get(`/business/projects/${projectId}/payment-milestones`);
      console.log('Payment milestones response:', response.data);
      setPaymentMilestones(response.data);
    } catch (error) {
      console.error('Error fetching payment milestones:', error);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      if (!paymentFormData.po_id) {
        showSnackbar('Please select a purchase order', 'error');
        return;
      }

      const submitData = {
        payment_date: paymentFormData.payment_date!.toISOString().split('T')[0],
        amount: parseFloat(paymentFormData.amount),
        status: paymentFormData.status,
        remarks: paymentFormData.remarks,
        po_id: parseInt(paymentFormData.po_id),
        billing_start_date: paymentFormData.billing_start_date!.toISOString().split('T')[0],
        billing_end_date: paymentFormData.billing_end_date!.toISOString().split('T')[0]
      };

      if (selectedPayment) {
        await api.put(`/business/projects/${selectedProject!.id}/payment-milestones/${selectedPayment.id}`, submitData);
        showSnackbar('Payment milestone updated successfully', 'success');
      } else {
        await api.post(`/business/projects/${selectedProject!.id}/payment-milestones`, submitData);
        showSnackbar('Payment milestone created successfully', 'success');
      }
      fetchPaymentMilestones(selectedProject!.id);
      setPaymentFormData({
        payment_date: null,
        amount: '',
        status: 'pending',
        remarks: '',
        po_id: '',
        billing_start_date: null,
        billing_end_date: null
      });
      setSelectedPayment(null);
      
      // Refresh the main projects data to update totals
      fetchProjects();
    } catch (error) {
      console.error('Error saving payment milestone:', error);
      showSnackbar('Failed to save payment milestone', 'error');
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!window.confirm('Are you sure you want to delete this payment milestone?')) {
      return;
    }

    try {
      await api.delete(`/business/projects/${selectedProject!.id}/payment-milestones/${paymentId}`);
      showSnackbar('Payment milestone deleted successfully', 'success');
      fetchPaymentMilestones(selectedProject!.id);
      
      // Refresh the main projects data to update totals
      fetchProjects();
    } catch (error) {
      console.error('Error deleting payment milestone:', error);
      showSnackbar('Failed to delete payment milestone', 'error');
    }
  };

  const handleOpenDetailsDialog = async (project: Project) => {
    setSelectedProject(project);
    setOpenDetailsDialog(true);
    await fetchPaymentMilestones(project.id);
    await fetchPurchaseOrders(project.id);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedProject(null);
    setPaymentMilestones([]);
    setPurchaseOrders([]);
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Business Division Projects</Typography>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Client Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Order Value</TableCell>
              <TableCell>Total Received</TableCell>
              <TableCell>Extended Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.entity_name}</TableCell>
                <TableCell>{project.client_name}</TableCell>
                <TableCell>{new Date(project.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(project.end_date).toLocaleDateString()}</TableCell>
                <TableCell>₹{project.order_value.toLocaleString()}</TableCell>
                <TableCell>
                  <Typography
                    component="span"
                    sx={{
                      color: project.total_received && project.total_received > 0 ? '#2e7d32' : '#666',
                      fontWeight: project.total_received && project.total_received > 0 ? 'bold' : 'normal'
                    }}
                  >
                    ₹{project.total_received?.toLocaleString() || '0'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {project.extended_date ? new Date(project.extended_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleOpenDetailsDialog(project)} color="primary">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={projectsWithPurchaseOrders.has(project.id) ? "Manage Payment Milestones" : "No purchase orders found. Add purchase orders first."}>
                      <span>
                        <IconButton 
                          onClick={() => handleOpenPaymentDialog(project)} 
                          color="secondary"
                          disabled={!projectsWithPurchaseOrders.has(project.id)}
                        >
                          <AddIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">No projects found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Payment Milestones - {selectedProject?.entity_name}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="h6" mb={2}>Add New Payment Milestone</Typography>
            <Stack spacing={2}>
              <TextField
                label="Purchase Order"
                select
                value={paymentFormData.po_id}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, po_id: e.target.value })}
                fullWidth
                required
                disabled={purchaseOrders.length === 0}
                helperText={purchaseOrders.length === 0 ? 'No purchase orders found for this project' : ''}
              >
                {(() => {
                  console.log('Rendering purchase orders dropdown with:', purchaseOrders);
                  return purchaseOrders.map((po) => (
                    <MenuItem key={po.po_id} value={po.po_id.toString()}>
                      {po.invoice_no} - ₹{po.invoice_value.toLocaleString()} ({po.invoice_status})
                    </MenuItem>
                  ));
                })()}
              </TextField>
              <DesktopDatePicker
                label="Payment Date"
                value={paymentFormData.payment_date}
                onChange={(date) => setPaymentFormData({ ...paymentFormData, payment_date: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DesktopDatePicker
                label="Billing Start Date"
                value={paymentFormData.billing_start_date}
                onChange={(date) => setPaymentFormData({ ...paymentFormData, billing_start_date: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DesktopDatePicker
                label="Billing End Date"
                value={paymentFormData.billing_end_date}
                onChange={(date) => setPaymentFormData({ ...paymentFormData, billing_end_date: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
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
              <TextField
                label="Status"
                select
                value={paymentFormData.status}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, status: e.target.value as any })}
                fullWidth
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="received">Received</MenuItem>
              </TextField>
              <TextField
                label="Remarks"
                value={paymentFormData.remarks}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, remarks: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>

            <Box mt={3}>
              <Typography variant="h6" mb={2}>Payment Milestones</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      console.log('Rendering payment milestones table with:', paymentMilestones);
                      return paymentMilestones.map((payment) => (
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
                          <TableCell>
                            <Tooltip title="Edit Payment Milestone">
                              <IconButton 
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setPaymentFormData({
                                    payment_date: new Date(payment.payment_date),
                                    amount: payment.amount.toString(),
                                    status: payment.status,
                                    remarks: payment.remarks,
                                    po_id: payment.po_id.toString(),
                                    billing_start_date: new Date(payment.billing_start_date),
                                    billing_end_date: new Date(payment.billing_end_date)
                                  });
                                }} 
                                color="primary" 
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Payment Milestone">
                              <IconButton 
                                onClick={() => handleDeletePayment(payment.id)} 
                                color="error" 
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                    {paymentMilestones.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">No payment milestones found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Close</Button>
          <Button onClick={handlePaymentSubmit} variant="contained">
            {selectedPayment ? 'Update' : 'Add'} Payment Milestone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Project Details - {selectedProject?.entity_name}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            {/* Project Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" mb={2}>Project Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Order Value</Typography>
                  <Typography variant="h6">₹{selectedProject?.order_value.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Total Received</Typography>
                  <Typography variant="h6" color="success.main">
                    ₹{selectedProject?.total_received?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Remaining</Typography>
                  <Typography variant="h6" color="warning.main">
                    ₹{((selectedProject?.order_value || 0) - (selectedProject?.total_received || 0)).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Progress</Typography>
                  <Typography variant="h6">
                    {selectedProject?.order_value ? 
                      Math.round(((selectedProject?.total_received || 0) / selectedProject.order_value) * 100) : 0}%
                  </Typography>
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
                  {(() => {
                    console.log('Rendering payment milestones table with:', paymentMilestones);
                    return paymentMilestones.map((payment) => (
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
                    ));
                  })()}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
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