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
  Tooltip
} from '@mui/material';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import api from '../../utils/api';

interface Product {
  id: number;
  entity_id: number;
  entity_name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  order_value: number;
  created_at: string;
  updated_at: string;
  total_received?: number;
}

interface BusinessEntity {
  id: number;
  name: string;
  entity_type: 'product' | 'project' | 'service';
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
  invoice_no?: string;
  billing_start_date: string;
  billing_end_date: string;
}

interface PurchaseOrder {
  po_id: number;
  invoice_no: string;
  invoice_date: string;
  invoice_value: number;
  invoice_status: string;
  requested_by_name: string;
}

interface FormData {
  entity_id: string;
}

const initialFormData: FormData = {
  entity_id: ''
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [productsWithPurchaseOrders, setProductsWithPurchaseOrders] = useState<Set<number>>(new Set());
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMilestone | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: null as Date | null,
    amount: '',
    status: 'pending' as 'received' | 'pending',
    remarks: '',
    po_id: '' as string,
    billing_start_date: null as Date | null,
    billing_end_date: null as Date | null
  });
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

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/business/products');
      const products = response.data;
      
      // Calculate total received amount for each product and check for purchase orders
      const productsWithTotals = await Promise.all(
        products.map(async (product: Product) => {
          try {
            const milestonesResponse = await api.get(`/business/products/${product.id}/payment-milestones`);
            const milestones = milestonesResponse.data;
            const totalReceived = milestones
              .filter((milestone: PaymentMilestone) => milestone.status === 'received')
              .reduce((sum: number, milestone: PaymentMilestone) => sum + Number(milestone.amount), 0);
            
            return {
              ...product,
              total_received: totalReceived
            };
          } catch (error) {
            console.error(`Error fetching milestones for product ${product.id}:`, error);
            return {
              ...product,
              total_received: 0
            };
          }
        })
      );
      
      setProducts(productsWithTotals);
      
      // Check which products have purchase orders
      const productsWithPOs = new Set<number>();
      for (const product of productsWithTotals) {
        try {
          const poResponse = await api.get(`/business/products/${product.id}/purchase-orders`);
          if (poResponse.data && poResponse.data.length > 0) {
            productsWithPOs.add(product.id);
          }
        } catch (error) {
          console.error(`Error checking purchase orders for product ${product.id}:`, error);
        }
      }
      setProductsWithPurchaseOrders(productsWithPOs);
    } catch (error) {
      console.error('Error fetching products:', error);
      showSnackbar('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const response = await api.get('/business/business-entities');
      setEntities(response.data.filter((entity: BusinessEntity) => entity.entity_type === 'product'));
    } catch (error) {
      console.error('Error fetching entities:', error);
      showSnackbar('Failed to fetch entities', 'error');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchEntities();
  }, [fetchProducts, fetchEntities]);

  const fetchPurchaseOrders = async (productId: number) => {
    try {
      const response = await api.get(`/business/products/${productId}/purchase-orders`);
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const handleOpenPaymentDialog = async (product: Product) => {
    try {
      // First check if purchase orders exist
      const purchaseOrdersResponse = await api.get(`/business/products/${product.id}/purchase-orders`);
      
      if (!purchaseOrdersResponse.data || purchaseOrdersResponse.data.length === 0) {
        showSnackbar('No purchase orders found for this product. Please add purchase orders first.', 'error');
        return;
      }
      
      // If purchase orders exist, proceed with opening the dialog
      setSelectedProduct(product);
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
      fetchPaymentMilestones(product.id);
      setPurchaseOrders(purchaseOrdersResponse.data);
    } catch (error: any) {
      console.error('Error checking purchase orders:', error);
      showSnackbar('Failed to check purchase orders', 'error');
    }
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedProduct(null);
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

  const fetchPaymentMilestones = async (productId: number) => {
    try {
      const response = await api.get(`/business/products/${productId}/payment-milestones`);
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
        await api.put(`/business/products/${selectedProduct!.id}/payment-milestones/${selectedPayment.id}`, submitData);
        showSnackbar('Payment milestone updated successfully', 'success');
      } else {
        await api.post(`/business/products/${selectedProduct!.id}/payment-milestones`, submitData);
        showSnackbar('Payment milestone created successfully', 'success');
      }
      fetchPaymentMilestones(selectedProduct!.id);
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
      
      // Refresh the main products data to update totals
      fetchProducts();
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
      await api.delete(`/business/products/${selectedProduct!.id}/payment-milestones/${paymentId}`);
      showSnackbar('Payment milestone deleted successfully', 'success');
      fetchPaymentMilestones(selectedProduct!.id);
      
      // Refresh the main products data to update totals
      fetchProducts();
    } catch (error) {
      console.error('Error deleting payment milestone:', error);
      showSnackbar('Failed to delete payment milestone', 'error');
    }
  };

  const handleOpenDetailsDialog = async (product: Product) => {
    setSelectedProduct(product);
    setOpenDetailsDialog(true);
    await fetchPaymentMilestones(product.id);
    await fetchPurchaseOrders(product.id);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedProduct(null);
    setPaymentMilestones([]);
    setPurchaseOrders([]);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        entity_id: parseInt(formData.entity_id)
      };

      if (selectedProductForEdit) {
        await api.put(`/business/products/${selectedProductForEdit.id}`, submitData);
        showSnackbar('Product updated successfully', 'success');
      } else {
        await api.post('/business/products', submitData);
        showSnackbar('Product created successfully', 'success');
      }
      handleCloseDialog();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showSnackbar('Failed to save product', 'error');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/business/products/${product.id}`);
      showSnackbar('Product deleted successfully', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showSnackbar('Failed to delete product', 'error');
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setSelectedProductForEdit(product);
      setFormData({
        entity_id: product.entity_id.toString()
      });
    } else {
      setSelectedProductForEdit(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProductForEdit(null);
    setFormData(initialFormData);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Product
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Order Value</TableCell>
              <TableCell>Total Received</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.entity_name}</TableCell>
                <TableCell>{product.client_name}</TableCell>
                <TableCell>{new Date(product.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(product.end_date).toLocaleDateString()}</TableCell>
                <TableCell>₹{product.order_value.toLocaleString()}</TableCell>
                <TableCell>₹{product.total_received?.toLocaleString() || '0'}</TableCell>
                <TableCell>
                  <Tooltip title={productsWithPurchaseOrders.has(product.id) ? "Add Payment Milestone" : "No purchase orders found. Add purchase orders first."}>
                    <span>
                      <IconButton 
                        onClick={() => handleOpenPaymentDialog(product)} 
                        size="small" 
                        color="primary"
                        disabled={!productsWithPurchaseOrders.has(product.id)}
                      >
                        <AddIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="View Details">
                    <IconButton onClick={() => handleOpenDetailsDialog(product)} size="small" color="info">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProductForEdit ? 'Edit Product' : 'Add New Product'}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedProductForEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Milestone Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Payment Milestones - {selectedProduct?.entity_name}
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
                helperText={purchaseOrders.length === 0 ? 'No purchase orders found for this product' : ''}
              >
                {purchaseOrders.map((po) => (
                  <MenuItem key={po.po_id} value={po.po_id.toString()}>
                    {po.invoice_no} - ₹{po.invoice_value.toLocaleString()} ({po.invoice_status})
                  </MenuItem>
                ))}
              </TextField>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                    ))}
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
          Product Details - {selectedProduct?.entity_name}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            {/* Product Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" mb={2}>Product Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Order Value</Typography>
                  <Typography variant="h6">₹{selectedProduct?.order_value.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Total Received</Typography>
                  <Typography variant="h6" color="success.main">
                    ₹{selectedProduct?.total_received?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Remaining</Typography>
                  <Typography variant="h6" color="warning.main">
                    ₹{((selectedProduct?.order_value || 0) - (selectedProduct?.total_received || 0)).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Progress</Typography>
                  <Typography variant="h6">
                    {selectedProduct?.order_value ? 
                      Math.round(((selectedProduct?.total_received || 0) / selectedProduct.order_value) * 100) : 0}%
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
                    <TableCell>Purchase Order</TableCell>
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
                      <TableCell>{payment.invoice_no || 'N/A'}</TableCell>
                      <TableCell>{payment.remarks}</TableCell>
                    </TableRow>
                  ))}
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

export default Products; 