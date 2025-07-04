import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface Employee {
  employee_id: number;
  employee_name: string;
  join_date: string;
  designation_id: number;
  technical_group_id: number;
  status: string;
  gender: string;
  level: number;
  centre: string;
  designation: string;
  designation_full: string;
  group_name: string;
  group_description: string;
}

interface Designation {
  designation_id: number;
  designation: string;
  designation_full: string;
  level: number;
}

interface TechnicalGroup {
  group_id: number;
  group_name: string;
  group_description: string;
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
];

const CENTRE_OPTIONS = [
  { value: 'KP', label: 'KP' },
  { value: 'EC', label: 'EC' },
];

interface FilterState {
  search: string;
  designation: string;
  group: string;
  level: string;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [technicalGroups, setTechnicalGroups] = useState<TechnicalGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    join_date: new Date().toISOString().split('T')[0],
    designation_id: '',
    initial_designation_id: '',
    technical_group_id: '',
    gender: '',
    level: 1,
    centre: '',
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
  
  // Combined filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    designation: '',
    group: '',
    level: ''
  });

  // Memoized filter function with better type safety
  const applyFilters = useCallback((employeeList: Employee[], currentFilters: FilterState): Employee[] => {
    return employeeList.filter(emp => {
      const searchTerm = currentFilters.search.toLowerCase();
      
      // Search filter - more efficient string comparison
      const searchMatch = !searchTerm || 
        emp.employee_id.toString().toLowerCase().includes(searchTerm) ||
        emp.employee_name.toLowerCase().includes(searchTerm);

      // Type-safe number comparisons
      const designationMatch = !currentFilters.designation || 
        emp.designation_id === Number(currentFilters.designation);

      const groupMatch = !currentFilters.group || 
        emp.technical_group_id === Number(currentFilters.group);

      const levelMatch = !currentFilters.level || 
        emp.level === Number(currentFilters.level);

      return searchMatch && designationMatch && groupMatch && levelMatch;
    });
  }, []);

  // Optimized filter update
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      setFilteredEmployees(applyFilters(employees, updatedFilters));
      setPage(0);
      return updatedFilters;
    });
  }, [employees, applyFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters: FilterState = {
      search: '',
      designation: '',
      group: '',
      level: ''
    };
    updateFilters(emptyFilters);
  }, [updateFilters]);

  // Effect to initialize filtered employees
  useEffect(() => {
    setFilteredEmployees(applyFilters(employees, filters));
  }, [employees, filters, applyFilters]);

  const fetchEmployees = async () => {
    try {
      console.log('=== Fetching Employees ===');
      const token = localStorage.getItem('token');
      console.log('Token present:', !!token);

      const response = await fetch('http://localhost:5000/api/hr/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch employees',
        severity: 'error'
      });
    }
  };

  const fetchDesignations = async () => {
    try {
      console.log('=== Fetching Designations ===');
      const token = localStorage.getItem('token');
      console.log('Token present:', !!token);

      const response = await fetch('http://localhost:5000/api/hr/designations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch designations');
      }

      const data = await response.json();
      setDesignations(data);
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  const fetchTechnicalGroups = async () => {
    try {
      console.log('=== Fetching Technical Groups ===');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');

      console.log('Making request to: http://localhost:5000/api/hr/technical_groups');
      const response = await fetch('http://localhost:5000/api/hr/technical_groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch technical groups');
      }

      const data = await response.json();
      setTechnicalGroups(data);
    } catch (error) {
      console.error('Error fetching technical groups:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('=== Initializing HR Data ===');
        await Promise.all([
          fetchEmployees(),
          fetchDesignations(),
          fetchTechnicalGroups()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, []);

  const handleOpen = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employee_id: employee.employee_id?.toString() || '',
        employee_name: employee.employee_name || '',
        join_date: employee.join_date || new Date().toISOString().split('T')[0],
        designation_id: employee.designation_id?.toString() || '',
        initial_designation_id: employee.designation_id?.toString() || '',
        technical_group_id: employee.technical_group_id?.toString() || '',
        gender: employee.gender || '',
        level: employee.level || 1,
        centre: employee.centre || '',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employee_id: '',
        employee_name: '',
        join_date: new Date().toISOString().split('T')[0],
        designation_id: '',
        initial_designation_id: '',
        technical_group_id: '',
        gender: '',
        level: 1,
        centre: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEmployee(null);
    setFormData({
      employee_id: '',
      employee_name: '',
      join_date: new Date().toISOString().split('T')[0],
      designation_id: '',
      initial_designation_id: '',
      technical_group_id: '',
      gender: '',
      level: 1,
      centre: '',
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const requiredFields = ['employee_id', 'employee_name', 'gender', 'centre', 'designation_id', 'initial_designation_id', 'technical_group_id'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        setSnackbar({
          open: true,
          message: `Please fill in all required fields: ${missingFields.join(', ')}`,
          severity: 'error'
        });
        return;
      }

      const url = editingEmployee
        ? `http://localhost:5000/api/hr/employees/${editingEmployee.employee_id}`
        : 'http://localhost:5000/api/hr/employees';

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          employee_id: parseInt(formData.employee_id),
          designation_id: parseInt(formData.designation_id),
          initial_designation_id: parseInt(formData.initial_designation_id),
          technical_group_id: parseInt(formData.technical_group_id),
          level: parseInt(formData.level.toString()),
          status: 'active'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save employee');
      }

      setSnackbar({
        open: true,
        message: editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!',
        severity: 'success'
      });
      
      handleClose();
      await fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error saving employee',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>Employees Information</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add New Employee
        </Button>
      </Box>

      {/* Improved Search and Filter Section */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search by ID or Name"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value.toLowerCase() })}
          sx={{ minWidth: 250 }}
          InputProps={{
            endAdornment: filters.search && (
              <IconButton size="small" onClick={() => updateFilters({ search: '' })}>
                <ClearIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Designation</InputLabel>
          <Select
            value={filters.designation}
            onChange={(e) => updateFilters({ designation: e.target.value })}
            label="Designation"
          >
            <MenuItem value="">All Designations</MenuItem>
            {designations.map((d) => (
              <MenuItem key={d.designation_id} value={d.designation_id.toString()}>
                {d.designation_full}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Technical Group</InputLabel>
          <Select
            value={filters.group}
            onChange={(e) => updateFilters({ group: e.target.value })}
            label="Technical Group"
          >
            <MenuItem value="">All Groups</MenuItem>
            {technicalGroups.map((g) => (
              <MenuItem key={g.group_id} value={g.group_id.toString()}>
                {g.group_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Level</InputLabel>
          <Select
            value={filters.level}
            onChange={(e) => updateFilters({ level: e.target.value })}
            label="Level"
          >
            <MenuItem value="">All Levels</MenuItem>
            {Array.from(new Set(employees.map(e => e.level)))
              .sort((a, b) => a - b)
              .map(level => (
                <MenuItem key={level} value={level.toString()}>
                  Level {level}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        
        {/* Improved Clear Filters Button */}
        {(filters.search || filters.designation || filters.group || filters.level) && (
          <Tooltip title="Clear all filters">
            <Button
              size="small"
              variant="outlined"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
            >
              Clear All
            </Button>
          </Tooltip>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Technical Group</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Centre</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((employee) => (
                <TableRow key={employee.employee_id}>
                  <TableCell>{employee.employee_id}</TableCell>
                  <TableCell>{employee.employee_name}</TableCell>
                  <TableCell>{new Date(employee.join_date).toLocaleDateString()}</TableCell>
                  <TableCell>{employee.designation_full} ({employee.designation})</TableCell>
                  <TableCell>{employee.group_name}</TableCell>
                  <TableCell>{employee.gender}</TableCell>
                  <TableCell>{employee.level}</TableCell>
                  <TableCell>{employee.centre}</TableCell>
                  <TableCell>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => handleOpen(employee)}
                      size="small"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredEmployees.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Employee ID"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              fullWidth
              required
              type="number"
            />
            
            <TextField
              label="Employee Name"
              value={formData.employee_name}
              onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              fullWidth
              required
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Join Date"
                value={formData.join_date ? new Date(formData.join_date) : new Date()}
                onChange={(date) => setFormData({
                  ...formData,
                  join_date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                })}
              />
            </LocalizationProvider>

            <FormControl fullWidth required>
              <InputLabel>Initial Designation (at Joining)</InputLabel>
              <Select
                value={formData.initial_designation_id}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ 
                    ...formData, 
                    initial_designation_id: newValue,
                    designation_id: !editingEmployee ? newValue : formData.designation_id 
                  });
                }}
                label="Initial Designation (at Joining)"
                disabled={!!editingEmployee}
              >
                {designations.map((designation) => (
                  <MenuItem 
                    key={designation.designation_id} 
                    value={designation.designation_id.toString()}
                  >
                    {designation.designation_full} ({designation.designation})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Current Designation</InputLabel>
              <Select
                value={formData.designation_id}
                onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
                label="Current Designation"
              >
                {designations.map((designation) => (
                  <MenuItem 
                    key={designation.designation_id} 
                    value={designation.designation_id.toString()}
                  >
                    {designation.designation_full} ({designation.designation})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Technical Group</InputLabel>
              <Select
                value={formData.technical_group_id}
                onChange={(e) => setFormData({ ...formData, technical_group_id: e.target.value })}
                label="Technical Group"
              >
                {technicalGroups.map((group) => (
                  <MenuItem 
                    key={group.group_id} 
                    value={group.group_id.toString()}
                  >
                    {group.group_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                label="Gender"
              >
                {GENDER_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Level"
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Centre</InputLabel>
              <Select
                value={formData.centre}
                onChange={(e) => setFormData({ ...formData, centre: e.target.value })}
                label="Centre"
              >
                {CENTRE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingEmployee ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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

export default Employees; 