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
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

interface Department {
  department_id: number;
  department_name: string;
}

interface ContractorMapping {
  contract_id: number;
  contractor_id: number;
  department_id: number;
  department_name: string;
  start_date: string;
  end_date: string;
}

interface FormData {
  department_id: string;
  start_date: Date | null;
  end_date: Date | null;
}

const ContractorMappings: React.FC = () => {
  const { contractorId } = useParams<{ contractorId: string }>();
  const navigate = useNavigate();
  const [mappings, setMappings] = useState<ContractorMapping[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ContractorMapping | null>(null);
  const [formData, setFormData] = useState<FormData>({
    department_id: '',
    start_date: null,
    end_date: null,
  });

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch('http://localhost:5000/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch departments (Status: ${response.status})`);
      }

      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch departments');
    }
  };

  const fetchMappings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log('Fetching mappings for contractor ID:', contractorId, 'Type:', typeof contractorId);

      const response = await fetch('http://localhost:5000/api/admin/contractors/mappings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch mappings (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log('All mappings received:', data);
      const parsedContractorId = parseInt(contractorId!);
      console.log('Parsed contractor ID:', parsedContractorId, 'Type:', typeof parsedContractorId);
      const filteredMappings = data.filter((m: ContractorMapping) => {
        console.log('Comparing mapping contractor_id:', m.contractor_id, 'Type:', typeof m.contractor_id, 'with parsed ID:', parsedContractorId);
        return m.contractor_id === parsedContractorId;
      });
      console.log('Filtered mappings for contractor:', filteredMappings);
      setMappings(filteredMappings);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch mappings');
    }
  };

  useEffect(() => {
    console.log('ContractorMappings component mounted with contractorId:', contractorId);
    fetchDepartments();
    fetchMappings();
  }, [contractorId]);

  const handleOpen = (mapping?: ContractorMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFormData({
        department_id: mapping.department_id.toString(),
        start_date: new Date(mapping.start_date),
        end_date: new Date(mapping.end_date),
      });
    } else {
      setEditingMapping(null);
      setFormData({
        department_id: '',
        start_date: null,
        end_date: null,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMapping(null);
  };

  const handleSubmit = async () => {
    if (!formData.department_id || !formData.start_date || !formData.end_date) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const url = editingMapping
        ? `http://localhost:5000/api/admin/contractors/mappings/${editingMapping.contract_id}`
        : 'http://localhost:5000/api/admin/contractors/mappings';

      const body = editingMapping
        ? {
            start_date: formData.start_date.toISOString().split('T')[0],
            end_date: formData.end_date.toISOString().split('T')[0],
          }
        : {
            contractor_id: parseInt(contractorId!),
            department_id: parseInt(formData.department_id),
            start_date: formData.start_date.toISOString().split('T')[0],
            end_date: formData.end_date.toISOString().split('T')[0],
          };

      const response = await fetch(url, {
        method: editingMapping ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to ${editingMapping ? 'update' : 'add'} mapping`);
      }

      handleClose();
      await fetchMappings();
    } catch (error) {
      console.error('Error saving mapping:', error);
      alert(error instanceof Error ? error.message : 'Failed to save mapping');
    }
  };

  const handleDelete = async (mappingId: number) => {
    if (window.confirm('Are you sure you want to delete this mapping?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        const response = await fetch(`http://localhost:5000/api/admin/contractors/mappings/${mappingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Failed to delete mapping');
        }

        await fetchMappings();
      } catch (error) {
        console.error('Error deleting mapping:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete mapping');
      }
    }
  };

  const handleDateChange = (field: 'start_date' | 'end_date', value: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Department Mappings</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/contractors')}
            sx={{ mr: 2 }}
          >
            Back to Contractors
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Mapping
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.contract_id}>
                <TableCell>{mapping.department_name}</TableCell>
                <TableCell>{format(new Date(mapping.start_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{format(new Date(mapping.end_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpen(mapping)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(mapping.contract_id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {!editingMapping && (
              <TextField
                select
                fullWidth
                label="Department"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.department_id} value={dept.department_id}>
                    {dept.department_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={(date) => handleDateChange('start_date', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={formData.end_date}
                onChange={(date) => handleDateChange('end_date', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingMapping ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractorMappings; 