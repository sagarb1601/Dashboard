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
  Tooltip,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { staff, departments } from '../../../utils/api';
import { Staff } from '../../../types/staff';
import ErrorNotification from '../../../components/ErrorNotification';
import dayjs, { Dayjs } from 'dayjs';

interface Department {
  department_id: number;
  department_name: string;
}

interface FormData {
  name: string;
  department_id: string;
  joining_date: Date | null;
  date_of_leaving: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

const initialFormData: FormData = {
  name: '',
  department_id: '',
  joining_date: null,
  date_of_leaving: null,
  status: 'ACTIVE',
  gender: 'MALE'
};

const StaffTab: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, departmentsRes] = await Promise.all([
        staff.getAll(),
        departments.getAll(),
      ]);
      
      if (!Array.isArray(departmentsRes.data)) {
        throw new Error('Invalid departments data received');
      }
      
      setStaffList(staffRes.data);
      setDepartmentsList(departmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error instanceof Error) {
        setError(`Failed to fetch data: ${error.message}`);
      } else {
        setError('Failed to fetch data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      const joiningDate = staffMember.joining_date ? parseISO(staffMember.joining_date) : null;
      const leavingDate = staffMember.date_of_leaving ? parseISO(staffMember.date_of_leaving) : null;
      
      setFormData({
        name: staffMember.name,
        department_id: staffMember.department_id.toString(),
        joining_date: joiningDate,
        date_of_leaving: leavingDate,
        status: staffMember.status,
        gender: staffMember.gender,
      });
    } else {
      setEditingStaff(null);
      setFormData(initialFormData);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStaff(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.department_id || !formData.joining_date) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.date_of_leaving && formData.joining_date && formData.date_of_leaving < formData.joining_date) {
      setFormError('Date of leaving must be after joining date');
      return;
    }

    setLoading(true);
    try {
      const status: 'ACTIVE' | 'INACTIVE' = formData.date_of_leaving ? 'INACTIVE' : 'ACTIVE';
      
      const payload = {
        ...formData,
        department_id: parseInt(formData.department_id),
        joining_date: format(formData.joining_date, 'yyyy-MM-dd'),
        date_of_leaving: formData.date_of_leaving ? format(formData.date_of_leaving, 'yyyy-MM-dd') : null,
        status,
      };

      if (editingStaff) {
        await staff.update(editingStaff.staff_id, payload);
      } else {
        await staff.create(payload);
      }

      handleClose();
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save staff member. Please try again.';
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLeavingDate = () => {
    setFormData({
      ...formData,
      date_of_leaving: null,
      status: 'ACTIVE'
    });
  };

  if (loading && !staffList.length) {
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
          Add Staff
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Joining Date</TableCell>
              <TableCell>Date of Leaving</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffList.map((staffMember) => (
              <TableRow key={staffMember.staff_id}>
                <TableCell>{staffMember.name}</TableCell>
                <TableCell>{staffMember.department_name}</TableCell>
                <TableCell>{staffMember.gender}</TableCell>
                <TableCell>
                  {format(parseISO(staffMember.joining_date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  {staffMember.date_of_leaving 
                    ? format(parseISO(staffMember.date_of_leaving), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={staffMember.status}
                    color={staffMember.status === 'ACTIVE' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit">
                      <IconButton 
                        onClick={() => handleOpen(staffMember)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2, minWidth: 400 }}>
            {formError && (
              <Alert 
                severity="error" 
                onClose={() => setFormError(null)}
                sx={{ width: '100%' }}
              >
                {formError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              select
              fullWidth
              label="Department"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              required
            >
              {departmentsList.map((dept) => (
                <MenuItem key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
              required
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Joining Date"
                value={formData.joining_date}
                onChange={(date) => setFormData({ ...formData, joining_date: date as Date | null })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    required: true,
                    variant: "outlined"
                  } 
                }}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date of Leaving"
                value={formData.date_of_leaving}
                onChange={(date) => setFormData({ ...formData, date_of_leaving: date ? dayjs(date).toDate() : null})}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={formData.joining_date || undefined}
                disabled={!formData.joining_date}
              />
            </LocalizationProvider>
            <TextField
              select
              fullWidth
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              required
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
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
            {loading ? <CircularProgress size={24} /> : editingStaff ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffTab;