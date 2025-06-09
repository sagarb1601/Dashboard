import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
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
  Stack,
  Chip,
  CircularProgress,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { staff, salaries } from '../../../utils/api';
import { Staff, Salary } from '../../../types/staff';
import ErrorNotification from '../../../components/ErrorNotification';
import { useSalaryContext } from '../../../contexts/SalaryContext';

interface FormData {
  staff_id: string;
  net_salary: string;
  payment_date: Date | null;
  status: 'PAID' | 'PENDING';
}

const initialFormData: FormData = {
  staff_id: '',
  net_salary: '',
  payment_date: null,
  status: 'PENDING',
};

const StaffSalaries: React.FC = () => {
  const [salaryList, setSalaryList] = useState<Salary[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshSalaries } = useSalaryContext();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salariesRes, staffRes] = await Promise.all([
        salaries.getAll(),
        staff.getAll(),
      ]);
      setSalaryList(salariesRes.data);
      setStaffList(staffRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (salary?: Salary) => {
    if (salary) {
      setEditingSalary(salary);
      setFormData({
        staff_id: salary.staff_id.toString(),
        net_salary: salary.net_salary.toString(),
        payment_date: parseISO(salary.payment_date),
        status: salary.status,
      });
    } else {
      setEditingSalary(null);
      setFormData(initialFormData);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSalary(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    if (!formData.staff_id || !formData.net_salary || !formData.payment_date) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        staff_id: parseInt(formData.staff_id),
        net_salary: parseFloat(formData.net_salary),
        payment_date: format(formData.payment_date, 'yyyy-MM-dd'),
        status: formData.status,
      };

      if (editingSalary) {
        await salaries.update(editingSalary.salary_id, payload);
      } else {
        await salaries.create(payload);
      }

      handleClose();
      await fetchData();
      refreshSalaries();
    } catch (error) {
      console.error('Error saving salary:', error);
      setError('Failed to save salary record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStaffActive = (staffId: number) => {
    const staffMember = staffList.find(s => s.staff_id === staffId);
    return staffMember?.status === 'ACTIVE';
  };

  const handleDelete = async (salaryId: number, staffId: number) => {
    if (!isStaffActive(staffId)) {
      return; // Don't allow deletion for inactive staff
    }

    if (window.confirm('Are you sure you want to delete this salary record?')) {
      setLoading(true);
      try {
        await salaries.delete(salaryId);
        await fetchData();
        refreshSalaries();
      } catch (error) {
        console.error('Error deleting salary:', error);
        setError('Failed to delete salary record. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStaffName = (staffId: number) => {
    const staffMember = staffList.find(s => s.staff_id === staffId);
    return staffMember ? staffMember.name : 'Unknown';
  };

  const getStaffStatus = (staffId: number) => {
    const staffMember = staffList.find(s => s.staff_id === staffId);
    return staffMember?.status || 'UNKNOWN';
  };

  if (loading && !salaryList.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <ErrorNotification
        open={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />

      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          disabled={loading}
        >
          Add Salary Record
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Staff Name</TableCell>
              <TableCell>Staff Status</TableCell>
              <TableCell>Net Salary</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salaryList.map((salary) => {
              const staffStatus = getStaffStatus(salary.staff_id);
              return (
                <TableRow key={salary.salary_id}>
                  <TableCell>{getStaffName(salary.staff_id)}</TableCell>
                  <TableCell>
                    <Chip
                      label={staffStatus}
                      color={staffStatus === 'ACTIVE' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>₹{salary.net_salary.toLocaleString()}</TableCell>
                  <TableCell>
                    {format(parseISO(salary.payment_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={salary.status}
                      color={salary.status === 'PAID' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleOpen(salary)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <Tooltip title={
                      !isStaffActive(salary.staff_id)
                        ? "Cannot delete salary records of inactive staff members"
                        : "Delete salary record"
                    }>
                      <span> {/* Wrapper span to make disabled Tooltip work */}
                        <IconButton 
                          onClick={() => handleDelete(salary.salary_id, salary.staff_id)}
                          disabled={loading || !isStaffActive(salary.staff_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingSalary ? 'Edit Salary Record' : 'Add New Salary Record'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              select
              fullWidth
              label="Staff Member"
              value={formData.staff_id}
              onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
              required
              disabled={!!editingSalary}
            >
              {staffList.map((staffMember) => (
                <MenuItem key={staffMember.staff_id} value={staffMember.staff_id}>
                  {staffMember.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Net Salary"
              type="number"
              value={formData.net_salary}
              onChange={(e) => setFormData({ ...formData, net_salary: e.target.value })}
              required
              InputProps={{
                startAdornment: '₹',
              }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={formData.payment_date}
                onChange={(date) => setFormData({ ...formData, payment_date: date })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    required: true 
                  } 
                }}
              />
            </LocalizationProvider>
            <TextField
              select
              fullWidth
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PAID' | 'PENDING' })}
              required
            >
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : editingSalary ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffSalaries; 