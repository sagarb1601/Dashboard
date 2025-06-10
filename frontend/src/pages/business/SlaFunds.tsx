import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../utils/api';

interface SlaFundDetail {
  id: number;
  agreement_id: number;
  agreement_title: string;
  payment_type: string;
  amount: number;
  payment_status: string;
  comments: string;
  created_at: string;
}

interface Agreement {
  id: number;
  title: string;
}

const PAYMENT_TYPES = ['Milestone', 'As per Terms and Conditions'];
const PAYMENT_STATUSES = ['pending', 'paid'];

const SlaFunds: React.FC = () => {
  const [slaFunds, setSlaFunds] = useState<SlaFundDetail[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedFund, setSelectedFund] = useState<SlaFundDetail | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    agreement_id: '',
    payment_type: '',
    amount: '',
    payment_status: 'pending',
    comments: ''
  });

  useEffect(() => {
    fetchSlaFunds();
    fetchAgreements();
  }, []);

  const fetchSlaFunds = async () => {
    try {
      const response = await api.get('/business/sla-funds');
      setSlaFunds(response.data);
    } catch (error) {
      setError('Failed to fetch SLA fund details');
      console.error('Error fetching SLA fund details:', error);
    }
  };

  const fetchAgreements = async () => {
    try {
      const response = await api.get('/business/agreements');
      setAgreements(response.data);
    } catch (error) {
      console.error('Error fetching agreements:', error);
    }
  };

  const handleOpenDialog = (fund?: SlaFundDetail) => {
    if (fund) {
      setSelectedFund(fund);
      setFormData({
        agreement_id: fund.agreement_id.toString(),
        payment_type: fund.payment_type,
        amount: fund.amount.toString(),
        payment_status: fund.payment_status,
        comments: fund.comments
      });
    } else {
      setSelectedFund(null);
      setFormData({
        agreement_id: '',
        payment_type: '',
        amount: '',
        payment_status: 'pending',
        comments: ''
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFund(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        agreement_id: parseInt(formData.agreement_id),
        amount: parseFloat(formData.amount)
      };

      if (selectedFund) {
        await api.put(`/business/sla-funds/${selectedFund.id}`, payload);
        setSuccess('SLA fund detail updated successfully');
      } else {
        await api.post('/business/sla-funds', payload);
        setSuccess('SLA fund detail created successfully');
      }

      handleCloseDialog();
      fetchSlaFunds();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save SLA fund detail');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this SLA fund detail?')) {
      try {
        await api.delete(`/business/sla-funds/${id}`);
        setSuccess('SLA fund detail deleted successfully');
        fetchSlaFunds();
      } catch (error) {
        setError('Failed to delete SLA fund detail');
        console.error('Error deleting SLA fund detail:', error);
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">SLA Fund Details</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add SLA Fund Detail
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agreement</TableCell>
              <TableCell>Payment Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slaFunds
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((fund) => (
                <TableRow key={fund.id}>
                  <TableCell>{fund.agreement_title}</TableCell>
                  <TableCell>{fund.payment_type}</TableCell>
                  <TableCell>{fund.amount}</TableCell>
                  <TableCell>{fund.payment_status}</TableCell>
                  <TableCell>{fund.comments}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(fund)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(fund.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={slaFunds.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedFund ? 'Edit SLA Fund Detail' : 'Add SLA Fund Detail'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Agreement</InputLabel>
              <Select
                value={formData.agreement_id}
                label="Agreement"
                onChange={(e) => setFormData({ ...formData, agreement_id: e.target.value })}
              >
                {agreements.map((agreement) => (
                  <MenuItem key={agreement.id} value={agreement.id}>
                    {agreement.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={formData.payment_type}
                label="Payment Type"
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
              >
                {PAYMENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={formData.payment_status}
                label="Payment Status"
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              >
                {PAYMENT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Comments"
              multiline
              rows={4}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedFund ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SlaFunds; 