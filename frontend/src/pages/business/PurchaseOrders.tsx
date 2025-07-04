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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../utils/api';

interface BusinessEntity {
  id: number;
  name: string;
  entity_type: 'product' | 'project' | 'service';
}

interface Employee {
  employee_id: number;
  employee_name: string;
}

interface PurchaseOrder {
  po_id: number;
  entity_type: 'product' | 'project' | 'service';
  entity_id: number;
  entity_name: string;
  client_name: string;
  invoice_no: string;
  invoice_date: string;
  invoice_value: number;
  payment_duration: string;
  invoice_status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  requested_by: number;
  requested_by_name: string;
  payment_mode: string;
  remarks: string;
}

const paymentDurations = [
  'Monthly',
  'Quarterly',
  'Half-yearly',
  'Yearly',
  'One-time'
];

type InvoiceStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid';

interface FormData {
  entity_id: string;
  invoice_no: string;
  invoice_date: string;
  invoice_value: string;
  payment_duration: string;
  invoice_status: string;
  requested_by: string;
  payment_mode: string;
  remarks: string;
}

interface FormErrors {
  entity_id?: string;
  invoice_no?: string;
  invoice_value?: string;
  payment_duration?: string;
}

const initialFormData: FormData = {
  entity_id: '',
  invoice_no: '',
  invoice_date: new Date().toISOString().split('T')[0],
  invoice_value: '',
  payment_duration: 'Monthly',
  invoice_status: 'Pending',
  requested_by: '',
  payment_mode: '',
  remarks: ''
};

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'product' | 'project' | 'service' | ''>('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
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

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    
    if (!formData.entity_id) {
      errors.entity_id = 'Business Entity is required';
    }
    
    if (!formData.invoice_no) {
      errors.invoice_no = 'Invoice Number is required';
    }
    
    if (!formData.invoice_value) {
      errors.invoice_value = 'Invoice Value is required';
    } else if (isNaN(parseFloat(formData.invoice_value)) || parseFloat(formData.invoice_value) <= 0) {
      errors.invoice_value = 'Invoice Value must be a positive number';
    }
    
    if (!formData.payment_duration) {
      errors.payment_duration = 'Payment Duration is required';
    }
    
    return errors;
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      const response = await api.get('/business/purchase-orders');
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      showSnackbar('Failed to fetch purchase orders', 'error');
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

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/hr/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showSnackbar('Failed to fetch employees', 'error');
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchEntities();
    fetchEmployees();
  }, [fetchPurchaseOrders, fetchEntities, fetchEmployees]);

  const handleSubmit = async () => {
    // Validate form
    const errors = validateForm();
    setFormErrors(errors);
    
    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const submitData = {
        ...formData,
        entity_id: parseInt(formData.entity_id),
        invoice_value: parseFloat(formData.invoice_value),
        requested_by: formData.requested_by ? parseInt(formData.requested_by) : null
      };

      if (selectedPO) {
        await api.put(`/business/purchase-orders/${selectedPO.po_id}`, submitData);
        showSnackbar('Purchase order updated successfully', 'success');
      } else {
        await api.post('/business/purchase-orders', submitData);
        showSnackbar('Purchase order created successfully', 'success');
      }
      handleCloseDialog();
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      showSnackbar('Failed to save purchase order', 'error');
    }
  };

  const handleDelete = async (po: PurchaseOrder) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) {
      return;
    }

    try {
      await api.delete(`/business/purchase-orders/${po.po_id}`);
      showSnackbar('Purchase order deleted successfully', 'success');
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      showSnackbar('Failed to delete purchase order', 'error');
    }
  };

  const handleOpenDialog = (po?: PurchaseOrder) => {
    if (po) {
      setSelectedPO(po);
      setSelectedEntityType(po.entity_type);
      setFormData({
        entity_id: po.entity_id.toString(),
        invoice_no: po.invoice_no,
        invoice_date: po.invoice_date,
        invoice_value: po.invoice_value.toString(),
        payment_duration: po.payment_duration || '',
        invoice_status: po.invoice_status,
        requested_by: po.requested_by ? po.requested_by.toString() : '',
        payment_mode: po.payment_mode || '',
        remarks: po.remarks || ''
      });
    } else {
      setSelectedPO(null);
      setSelectedEntityType('');
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPO(null);
    setSelectedEntityType('');
    setFormData(initialFormData);
    setFormErrors({});
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Purchase Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Purchase Order
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Entity Name</TableCell>
              <TableCell>Client Name</TableCell>
              <TableCell>PO Number</TableCell>
              <TableCell>PO Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchaseOrders.map((po) => (
              <TableRow key={po.po_id}>
                <TableCell>{po.entity_name}</TableCell>
                <TableCell>{po.client_name}</TableCell>
                <TableCell>{po.invoice_no}</TableCell>
                <TableCell>{new Date(po.invoice_date).toLocaleDateString()}</TableCell>
                <TableCell>₹{po.invoice_value.toLocaleString()}</TableCell>
                <TableCell>{po.invoice_status}</TableCell>
                <TableCell>{po.payment_duration}</TableCell>
                <TableCell>{po.remarks}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(po)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(po)} size="small" color="error">
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
          {selectedPO ? 'Edit Purchase Order' : 'Add New Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth required>
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={selectedPO?.entity_type || selectedEntityType}
                label="Entity Type"
                onChange={(e) => {
                  const entityType = e.target.value as 'product' | 'project' | 'service';
                  setSelectedEntityType(entityType);
                  setFormData({
                    ...formData,
                    entity_id: '',
                    invoice_no: '',
                    invoice_date: new Date().toISOString().split('T')[0],
                    invoice_value: '',
                    payment_duration: 'Monthly',
                    invoice_status: 'Pending',
                    requested_by: '',
                    payment_mode: '',
                    remarks: ''
                  });
                }}
              >
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="service">Service</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required error={!!formErrors.entity_id}>
              <InputLabel>Business Entity</InputLabel>
              <Select
                value={formData.entity_id}
                label="Business Entity"
                onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                disabled={!selectedEntityType && !selectedPO?.entity_type}
              >
                {entities
                  .filter(entity => {
                    const currentEntityType = selectedPO?.entity_type || selectedEntityType;
                    return currentEntityType && entity.entity_type === currentEntityType;
                  })
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

            <TextField
              label="Invoice Number"
              value={formData.invoice_no}
              onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
              fullWidth
              required
              error={!!formErrors.invoice_no}
              helperText={formErrors.invoice_no}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Invoice Date"
                value={new Date(formData.invoice_date)}
                onChange={(date) => date && setFormData({
                  ...formData,
                  invoice_date: date.toISOString().split('T')[0]
                })}
              />
            </LocalizationProvider>

            <TextField
              label="Invoice Value"
              type="number"
              value={formData.invoice_value}
              onChange={(e) => setFormData({ ...formData, invoice_value: e.target.value })}
              fullWidth
              required
              error={!!formErrors.invoice_value}
              helperText={formErrors.invoice_value}
              InputProps={{
                startAdornment: <Typography>₹</Typography>
              }}
            />

            <FormControl fullWidth required error={!!formErrors.payment_duration}>
              <InputLabel>Payment Duration</InputLabel>
              <Select
                value={formData.payment_duration}
                label="Payment Duration"
                onChange={(e) => setFormData({ ...formData, payment_duration: e.target.value })}
                required
              >
                {paymentDurations.map((duration) => (
                  <MenuItem key={duration} value={duration}>
                    {duration}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.payment_duration && (
                <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                  {formErrors.payment_duration}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Invoice Status</InputLabel>
              <Select
                value={formData.invoice_status}
                label="Invoice Status"
                onChange={(e) => setFormData({ ...formData, invoice_status: e.target.value as InvoiceStatus })}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Requested By</InputLabel>
              <Select
                value={formData.requested_by}
                label="Requested By"
                onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.employee_id} value={employee.employee_id.toString()}>
                    {employee.employee_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Payment Mode"
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              fullWidth
            />

            <TextField
              label="Remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedPO ? 'Update' : 'Create'}
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

export default PurchaseOrders; 