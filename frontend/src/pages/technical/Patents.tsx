import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Alert,
  Autocomplete,
  Stack,
  FormHelperText,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, History as HistoryIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { SelectChangeEvent } from '@mui/material/Select';

interface Employee {
  employee_id: number;
  employee_name: string;
}

interface Inventor {
  employee_id: number;
  employee_name: string;
}

type PatentStatus = 'Filed' | 'Under Review' | 'Granted' | 'Rejected';

interface StatusHistory {
  history_id: number;
  old_status: PatentStatus;
  new_status: PatentStatus;
  remarks: string;
  update_date: string;
  updated_by_group_name: string;
}

interface Patent {
  patent_id: number;
  patent_title: string;
  filing_date: string;
  application_number: string;
  status: PatentStatus;
  remarks: string | null;
  inventors: Inventor[];
  grant_date: string | null;
  rejection_date: string | null;
  rejection_reason: string | null;
  group_name: string;
  status_history?: StatusHistory[];
}

interface FormData {
  patent_title: string;
  filing_date: string;
  application_number: string;
  status: PatentStatus;
  remarks: string;
  inventors: Employee[];
  grant_date: string;
  rejection_date: string;
  rejection_reason: string;
}

interface StatusUpdateData {
  new_status: PatentStatus;
  remarks: string;
  update_date: string;
}

const statusOptions = ['Filed', 'Under Review', 'Granted', 'Rejected'];

const Patents: React.FC = () => {
  const { user } = useAuth();
  const [patents, setPatents] = useState<Patent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventorsError, setInventorsError] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPatent, setEditingPatent] = useState<Patent | null>(null);
  const [formData, setFormData] = useState<FormData>({
    patent_title: '',
    filing_date: '',
    application_number: '',
    status: 'Filed',
    remarks: '',
    inventors: [],
    grant_date: '',
    rejection_date: '',
    rejection_reason: ''
  });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<StatusUpdateData>({
    new_status: '' as PatentStatus,
    remarks: '',
    update_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPatents();
    fetchEmployees();
  }, []);

  const fetchPatents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/technical/patents');
      setPatents(response.data);
    } catch (err) {
      console.error('Error fetching patents:', err);
      setError('Failed to fetch patents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/technical/patents/inventors');
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees. Please try again.');
    }
  };

  const handleEdit = (patent: Patent | null) => {
    setEditingPatent(patent);
    if (patent) {
      setFormData({
        patent_title: patent.patent_title,
        filing_date: patent.filing_date,
        application_number: patent.application_number,
        status: patent.status as PatentStatus,
        remarks: patent.remarks || '',
        inventors: patent.inventors.map(inv => ({
          employee_id: inv.employee_id,
          employee_name: inv.employee_name
        })),
        grant_date: patent.grant_date || '',
        rejection_date: patent.rejection_date || '',
        rejection_reason: patent.rejection_reason || ''
      });
    } else {
      setFormData({
        patent_title: '',
        filing_date: '',
        application_number: '',
        status: 'Filed',
        remarks: '',
        inventors: [],
        grant_date: '',
        rejection_date: '',
        rejection_reason: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPatent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error states
    setError(null);
    setInventorsError(false);

    // Validate required fields
    const requiredFields = {
      patent_title: 'Patent Title',
      filing_date: 'Filing Date',
      application_number: 'Application Number',
      status: 'Status'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !formData[field as keyof FormData])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      setError(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate inventors
    if (!Array.isArray(formData.inventors)) {
      setError('Invalid inventors data');
      setInventorsError(true);
      return;
    }

    if (formData.inventors.length === 0) {
      setError('Please select at least one inventor');
      setInventorsError(true);
      return;
    }

    try {
      // Format dates to YYYY-MM-DD
      const formatDate = (date: string | null) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
      };

      // Prepare the data according to backend schema
      const data = {
        patent_title: formData.patent_title.trim(),
        filing_date: formatDate(formData.filing_date),
        application_number: formData.application_number.trim(),
        status: formData.status,
        remarks: formData.remarks?.trim() || '',
        inventors: formData.inventors.map(emp => emp.employee_id),
        grant_date: formData.status === 'Granted' ? formatDate(formData.grant_date) : '',
        rejection_date: formData.status === 'Rejected' ? formatDate(formData.rejection_date) : '',
        rejection_reason: formData.status === 'Rejected' ? formData.rejection_reason?.trim() : ''
      };

      console.log('Submitting patent data:', JSON.stringify(data, null, 2));

      if (editingPatent) {
        const response = await api.put(`/technical/patents/${editingPatent.patent_id}`, data);
        console.log('Patent update response:', response.data);
      } else {
        const response = await api.post('/technical/patents', data);
        console.log('Patent creation response:', response.data);
      }

      handleCloseDialog();
      fetchPatents();
    } catch (err: any) {
      console.error('Error saving patent:', err);
      console.error('Error response data:', err.response?.data);
      
      // Handle different types of error responses
      let errorMessage = 'Failed to save patent. Please try again.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        console.log('Error data type:', typeof errorData, 'Error data:', JSON.stringify(errorData, null, 2));
        
        // Handle Zod validation errors
        if (Array.isArray(errorData)) {
          errorMessage = errorData.map((err: any) => err.message).join(', ');
        }
        // Handle single error message
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        // Handle error object
        else if (typeof errorData === 'object') {
          if (errorData.error) {
            if (Array.isArray(errorData.error)) {
              errorMessage = errorData.error.map((err: any) => err.message).join(', ');
            } else {
              errorMessage = errorData.error;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.validation) {
            errorMessage = Object.entries(errorData.validation)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
          } else {
            // Log the full error object for debugging
            console.log('Full error object:', JSON.stringify(errorData, null, 2));
            errorMessage = 'Validation failed. Please check all fields.';
          }
        }
      }

      setError(errorMessage);
      
      // Set inventors error if the error is related to inventors
      if (typeof errorMessage === 'string' && 
          errorMessage.toLowerCase().includes('inventor')) {
        setInventorsError(true);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInventorsChange = (_: any, newValue: Employee[]) => {
    console.log('Inventors changed - New value:', {
      value: newValue,
      length: newValue?.length,
      type: typeof newValue,
      isArray: Array.isArray(newValue)
    });

    // Ensure newValue is an array
    if (!Array.isArray(newValue)) {
      console.error('handleInventorsChange received non-array value:', newValue);
      return;
    }

    // Update form data and clear errors
    setFormData(prev => ({ ...prev, inventors: newValue }));
    setInventorsError(false);
    setError(null);
  };

  const handleNewPatent = () => {
    setEditingPatent(null);
    setFormData({
      patent_title: '',
      filing_date: '',
      application_number: '',
      status: 'Filed',
      remarks: '',
      inventors: [],
      grant_date: '',
      rejection_date: '',
      rejection_reason: ''
    });
    setOpenDialog(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedPatent) return;

    try {
      console.log('Sending status update data:', {
        patentId: selectedPatent.patent_id,
        data: statusUpdateData
      });
      
      const response = await api.put(`/technical/patents/${selectedPatent.patent_id}/status`, statusUpdateData);
      console.log('Status update response:', response.data);
      
      // Update the patents list
      setPatents(patents.map(p => 
        p.patent_id === selectedPatent.patent_id ? response.data : p
      ));
      
      setStatusUpdateDialogOpen(false);
      setStatusUpdateData({
        new_status: '' as PatentStatus,
        remarks: '',
        update_date: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      console.error('Error updating status:', err);
      console.error('Error details:', {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (patentId: number) => {
    if (!window.confirm('Are you sure you want to delete this patent? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/technical/patents/${patentId}`);
      fetchPatents();  // Refresh the list
    } catch (err: any) {
      console.error('Error deleting patent:', err);
      setError(err.response?.data?.error || 'Failed to delete patent');
    }
  };

  const getStatusColor = (status: PatentStatus) => {
    switch (status) {
      case 'Granted': return 'success';
      case 'Rejected': return 'error';
      case 'Under Review': return 'warning';
      default: return 'default';
    }
  };

  const StatusHistoryDialog = ({ open, onClose, history }: { open: boolean; onClose: () => void; history: StatusHistory[] }) => {
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'N/A';
      try {
        // Parse the date string (YYYY-MM-DD format)
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
          console.error('Invalid date:', dateString);
          return 'Invalid date';
        }
        // Format as "Month DD, YYYY"
        return format(date, 'MMMM d, yyyy');
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Status History</DialogTitle>
        <DialogContent>
          <List>
            {history && history.length > 0 ? (
              history.map((item, index) => (
                <Box key={item.history_id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" color="primary">
                          Status changed from {item.old_status || 'N/A'} to {item.new_status}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Updated by: {item.updated_by_group_name || 'Unknown'}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            {formatDate(item.update_date)}
                          </Typography>
                          {item.remarks && (
                            <>
                              <br />
                              <Typography component="span" variant="body2" color="text.secondary">
                                Remarks: {item.remarks}
                              </Typography>
                            </>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  {index < history.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No status history available" />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">Patents</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleEdit(null)}
        >
          Add Patent
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patent Title</TableCell>
              <TableCell>Filing Date</TableCell>
              <TableCell>Application Number</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Inventors</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patents.map((patent) => (
              <TableRow key={patent.patent_id}>
                <TableCell>{patent.patent_title}</TableCell>
                <TableCell>{format(new Date(patent.filing_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{patent.application_number}</TableCell>
                <TableCell>
                  <Chip
                    label={patent.status}
                    color={getStatusColor(patent.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {patent.inventors.map((inventor) => (
                      <Chip
                        key={inventor.employee_id}
                        label={inventor.employee_name}
                        size="small"
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedPatent(patent);
                        setHistoryDialogOpen(true);
                      }}
                      title="View History"
                    >
                      <HistoryIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedPatent(patent);
                        setStatusUpdateDialogOpen(true);
                      }}
                      title="Update Status"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(patent.patent_id)}
                      title="Delete Patent"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status History Dialog */}
      <StatusHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        history={selectedPatent?.status_history || []}
      />

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialogOpen}
        onClose={() => {
          setStatusUpdateDialogOpen(false);
          setStatusUpdateData({
            new_status: '' as PatentStatus,
            remarks: '',
            update_date: new Date().toISOString().split('T')[0]
          });
        }}
      >
        <DialogTitle>Update Patent Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2, minWidth: 300 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={statusUpdateData.new_status}
                onChange={(e) => setStatusUpdateData({
                  ...statusUpdateData,
                  new_status: e.target.value as PatentStatus
                })}
                label="New Status"
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Update Date"
              type="date"
              value={statusUpdateData.update_date}
              onChange={(e) => setStatusUpdateData({
                ...statusUpdateData,
                update_date: e.target.value
              })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Remarks"
              multiline
              rows={3}
              value={statusUpdateData.remarks}
              onChange={(e) => setStatusUpdateData({
                ...statusUpdateData,
                remarks: e.target.value
              })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setStatusUpdateDialogOpen(false);
            setStatusUpdateData({
              new_status: '' as PatentStatus,
              remarks: '',
              update_date: new Date().toISOString().split('T')[0]
            });
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!statusUpdateData.new_status || !statusUpdateData.update_date}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPatent ? 'Edit Patent' : 'Add New Patent'}
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                name="patent_title"
                label="Patent Title"
                value={formData.patent_title}
                onChange={handleInputChange}
                required
                fullWidth
                error={!!error && !formData.patent_title}
                helperText={error && !formData.patent_title ? 'Patent title is required' : ''}
              />
              <TextField
                name="application_number"
                label="Application Number"
                value={formData.application_number}
                onChange={handleInputChange}
                required
                fullWidth
                error={!!error && !formData.application_number}
                helperText={error && !formData.application_number ? 'Application number is required' : ''}
              />
              <TextField
                name="filing_date"
                label="Filing Date"
                type="date"
                value={formData.filing_date}
                onChange={handleInputChange}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!error && !formData.filing_date}
                helperText={error && !formData.filing_date ? 'Filing date is required' : ''}
              />
              <FormControl fullWidth required error={!!error && !formData.status}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as PatentStatus;
                    setFormData(prev => ({
                      ...prev,
                      status: newStatus,
                      grant_date: newStatus === 'Granted' ? prev.grant_date : '',
                      rejection_date: newStatus === 'Rejected' ? prev.rejection_date : '',
                      rejection_reason: newStatus === 'Rejected' ? prev.rejection_reason : ''
                    }));
                  }}
                  label="Status"
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
                {error && !formData.status && (
                  <FormHelperText>Status is required</FormHelperText>
                )}
              </FormControl>

              <Autocomplete
                multiple
                options={employees}
                getOptionLabel={(option) => option.employee_name}
                value={formData.inventors}
                onChange={handleInventorsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Inventors"
                    required
                    error={inventorsError}
                    helperText={inventorsError ? 'Please select at least one inventor' : ''}
                    inputProps={{
                      ...params.inputProps,
                      'aria-label': 'Select inventors'
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        {...chipProps}
                        label={option.employee_name}
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => {
                  const isEqual = option.employee_id === value.employee_id;
                  console.log('isOptionEqualToValue:', { option, value, isEqual });
                  return isEqual;
                }}
                noOptionsText="No employees found"
                loadingText="Loading employees..."
              />

              {formData.status === 'Granted' && (
                <TextField
                  name="grant_date"
                  label="Grant Date"
                  type="date"
                  value={formData.grant_date}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}

              {formData.status === 'Rejected' && (
                <>
                  <TextField
                    name="rejection_date"
                    label="Rejection Date"
                    type="date"
                    value={formData.rejection_date}
                    onChange={handleInputChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    name="rejection_reason"
                    label="Rejection Reason"
                    value={formData.rejection_reason}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </>
              )}

              <TextField
                name="remarks"
                label="Remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingPatent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patents; 