import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Avatar,
  Badge
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { api } from '../../services/api';

interface PurchaseOrder {
  po_id: number;
  entity_id: number;
  invoice_no: string;
  invoice_date: string;
  invoice_value: number;
  payment_duration: string;
  status: string;
  requested_by: number;
  payment_mode: string;
  remarks: string;
  entity_name: string;
  entity_type: string;
  order_value: number;
  client_name: string;
  requested_by_name: string;
}

interface StatusHistory {
  id: number;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  reason: string | null;
  changed_by: string;
  status_change_date?: string;
}

const statusColors = {
  'Payment Pending': '#ff9800',
  'Partial Payment': '#2196f3',
  'Paid Completely': '#4caf50',
  'Rejected by Client': '#f44336'
};

const statusIcons = {
  'Payment Pending': <PendingIcon />,
  'Partial Payment': <PaymentIcon />,
  'Paid Completely': <CheckCircleIcon />,
  'Rejected by Client': <CancelIcon />
};

const PurchaseOrderStatus: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [statusChangeDate, setStatusChangeDate] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchPurchaseOrders = async () => {
    try {
      console.log('Fetching purchase orders...');
      const response = await api.get('/business/purchase-orders');
      console.log('Purchase orders response:', response.data);
      setPurchaseOrders(response.data);
    } catch (error: any) {
      console.error('Error fetching purchase orders:', error);
      console.error('Error response:', error.response);
      showSnackbar(`Failed to fetch purchase orders: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async (poId: number) => {
    try {
      const response = await api.get(`/business/purchase-orders/${poId}/status-history`);
      setStatusHistory(response.data);
    } catch (error) {
      console.error('Error fetching status history:', error);
      showSnackbar('Failed to fetch status history', 'error');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedPO || !newStatus || !statusChangeDate) return;

    try {
      await api.put(`/business/purchase-orders/${selectedPO.po_id}/status`, {
        new_status: newStatus,
        reason: reason,
        status_change_date: statusChangeDate
      });

      showSnackbar('Status updated successfully', 'success');
      setOpenStatusDialog(false);
      setNewStatus('');
      setReason('');
      setStatusChangeDate('');
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleViewHistory = async (po: PurchaseOrder) => {
    setSelectedPO(po);
    await fetchStatusHistory(po.po_id);
    setOpenHistoryDialog(true);
  };

  const handleEditStatus = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setNewStatus(po.status);
    setOpenStatusDialog(true);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading purchase orders...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: '#1976d2' }}>
        Purchase Order Status Management
      </Typography>

      {purchaseOrders.length === 0 ? (
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" textAlign="center" color="textSecondary">
              No purchase orders found
            </Typography>
            <Typography variant="body2" textAlign="center" color="textSecondary" sx={{ mt: 1 }}>
              Purchase orders will appear here once they are created
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={3}>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Invoice No</strong></TableCell>
                    <TableCell><strong>Client</strong></TableCell>
                    <TableCell><strong>Entity</strong></TableCell>
                    <TableCell><strong>Invoice Value</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.po_id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {po.invoice_no}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(po.invoice_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {po.client_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {po.entity_name}
                        </Typography>
                        <Chip 
                          label={po.entity_type} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(po.invoice_value)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            icon={statusIcons[po.status as keyof typeof statusIcons]}
                            label={po.status}
                            sx={{
                              backgroundColor: statusColors[po.status as keyof typeof statusColors],
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Status History">
                            <IconButton
                              onClick={() => handleViewHistory(po)}
                              color="info"
                              size="small"
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Status">
                            <IconButton
                              onClick={() => handleEditStatus(po)}
                              color="primary"
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            Update Purchase Order Status
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Purchase Order: {selectedPO?.invoice_no}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Client: {selectedPO?.client_name}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
              >
                <MenuItem value="Payment Pending">Payment Pending</MenuItem>
                <MenuItem value="Partial Payment">Partial Payment</MenuItem>
                <MenuItem value="Paid Completely">Paid Completely</MenuItem>
                <MenuItem value="Rejected by Client">Rejected by Client</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for Status Change"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Enter reason for status change..."
            />

            <TextField
              fullWidth
              type="date"
              label="Date of Status Change"
              value={statusChangeDate}
              onChange={(e) => setStatusChangeDate(e.target.value)}
              sx={{ mt: 2 }}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="When did this status change occur? (e.g., when payment was received, when rejection was known)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained" 
            disabled={!newStatus || !statusChangeDate}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon color="primary" />
            Status History - {selectedPO?.invoice_no}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Purchase Order: {selectedPO?.invoice_no}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Client: {selectedPO?.client_name} | Entity: {selectedPO?.entity_name}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <List>
              {statusHistory.map((history, index) => (
                <React.Fragment key={history.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Chip
                        icon={statusIcons[history.new_status as keyof typeof statusIcons]}
                        label={history.new_status}
                        size="small"
                        sx={{
                          backgroundColor: statusColors[history.new_status as keyof typeof statusColors],
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {history.new_status}
                          </Typography>
                          {history.old_status && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" color="textSecondary">
                                Changed from:
                              </Typography>
                              <Chip
                                label={history.old_status}
                                size="small"
                                variant="outlined"
                              />
                              <ArrowForwardIcon fontSize="small" color="action" />
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box mt={1}>
                          {history.reason && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Reason:</strong> {history.reason}
                            </Typography>
                          )}
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 20, height: 20 }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="caption" color="textSecondary">
                              {history.changed_by}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              • {formatDate(history.changed_at)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < statusHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrderStatus; 