import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Typography, FormControl, InputLabel,
  Select, MenuItem, Grid, Snackbar, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../utils/api';

interface BusinessEntity {
  id: number;
  name: string;
}

interface TechnicalGroup {
  group_id: number;
  group_name: string;
}

interface Employee {
  employee_id: number;
  employee_name: string;
}

interface GroupMapping {
  id: number;
  entity_id: number;
  entity_name: string;
  group_id: number;
  group_name: string;
  contact_person_id: number;
  contact_person_name: string;
  role: string;
}

const initialFormData = {
  entity_id: '',
  group_id: '',
  contact_person_id: '',
  role: ''
};

const TechnicalGroupMapping = () => {
  const [mappings, setMappings] = useState<GroupMapping[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [groups, setGroups] = useState<TechnicalGroup[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedMapping, setSelectedMapping] = useState<GroupMapping | null>(null);
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

  const fetchMappings = useCallback(async () => {
    try {
      const response = await api.get('/business/technical-group-mappings');
      setMappings(response.data);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      showSnackbar('Failed to fetch mappings', 'error');
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

  useEffect(() => {
    fetchMappings();
    fetchEntities();
    fetchGroups();
    fetchEmployees();
  }, [fetchMappings, fetchEntities]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/hr/technical_groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching technical groups:', error);
      showSnackbar('Failed to fetch technical groups', 'error');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/hr/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showSnackbar('Failed to fetch employees', 'error');
    }
  };

  const handleOpenDialog = (mapping?: GroupMapping) => {
    if (mapping) {
      setSelectedMapping(mapping);
      setFormData({
        entity_id: mapping.entity_id.toString(),
        group_id: mapping.group_id.toString(),
        contact_person_id: mapping.contact_person_id.toString(),
        role: mapping.role
      });
    } else {
      setSelectedMapping(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMapping(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        entity_id: parseInt(formData.entity_id),
        group_id: parseInt(formData.group_id),
        contact_person_id: parseInt(formData.contact_person_id)
      };

      if (selectedMapping) {
        await api.put(`/business/group-mappings/${selectedMapping.id}`, submitData);
        showSnackbar('Group mapping updated successfully', 'success');
      } else {
        await api.post('/business/group-mappings', submitData);
        showSnackbar('Group mapping created successfully', 'success');
      }
      handleCloseDialog();
      fetchMappings();
    } catch (error) {
      console.error('Error saving group mapping:', error);
      showSnackbar('Failed to save group mapping', 'error');
    }
  };

  const handleDelete = async (mapping: GroupMapping) => {
    if (!window.confirm('Are you sure you want to delete this group mapping?')) {
      return;
    }

    try {
      await api.delete(`/business/group-mappings/${mapping.id}`);
      showSnackbar('Group mapping deleted successfully', 'success');
      fetchMappings();
    } catch (error) {
      console.error('Error deleting group mapping:', error);
      showSnackbar('Failed to delete group mapping', 'error');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Technical Group Mappings</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Add New Mapping
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business Entity</TableCell>
              <TableCell>Technical Group</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.id}>
                <TableCell>{mapping.entity_name}</TableCell>
                <TableCell>{mapping.group_name}</TableCell>
                <TableCell>{mapping.contact_person_name}</TableCell>
                <TableCell>{mapping.role}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(mapping)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(mapping)} size="small" color="error">
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
          {selectedMapping ? 'Edit Group Mapping' : 'Add New Group Mapping'}
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
                    {entity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Technical Group</InputLabel>
              <Select
                value={formData.group_id}
                label="Technical Group"
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              >
                {groups.map((group) => (
                  <MenuItem key={group.group_id} value={group.group_id.toString()}>
                    {group.group_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Contact Person</InputLabel>
              <Select
                value={formData.contact_person_id}
                label="Contact Person"
                onChange={(e) => setFormData({ ...formData, contact_person_id: e.target.value })}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.employee_id} value={employee.employee_id.toString()}>
                    {employee.employee_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedMapping ? 'Update' : 'Create'}
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

export default TechnicalGroupMapping; 