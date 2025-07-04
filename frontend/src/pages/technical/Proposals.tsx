import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, History as HistoryIcon, Update as UpdateIcon, Timeline as TimelineIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { Autocomplete } from '@mui/material';

interface Employee {
  employee_id: number;
  employee_name: string;
}

type ProposalStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Presented to Working Group' | 'Presented to Ministry' | 'Approved' | 'Rejected';

interface StatusHistory {
  history_id: number;
  old_status: ProposalStatus;
  new_status: ProposalStatus;
  remarks: string;
  update_date: string;
  updated_by_name: string;
}

interface Proposal {
  proposal_id: number;
  proposal_title: string;
  submitted_by: number;
  submitted_by_name: string;
  submission_date: string;
  funding_agency: string;
  proposed_budget: number;
  status: ProposalStatus;
  remarks: string | null;
  approval_date: string | null;
  rejection_date: string | null;
  rejection_reason: string | null;
  group_name: string;
  status_history?: StatusHistory[];
}

interface FormData {
  proposal_title: string;
  submitted_by: number;
  submission_date: string;
  funding_agency: string;
  proposed_budget: string;
  status: ProposalStatus;
  remarks: string;
  approval_date: string;
  rejection_date: string;
  rejection_reason: string;
}

interface StatusUpdateData {
  new_status: ProposalStatus;
  remarks: string;
  update_date: string;
}

const statusOptions = ['Draft', 'Submitted', 'Under Review', 'Presented to Working Group', 'Presented to Ministry', 'Approved', 'Rejected'];
const fundingAgencyOptions = ['Miety', 'DST', 'Others'];

const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [formData, setFormData] = useState<FormData>({
    proposal_title: '',
    submitted_by: 0,
    submission_date: '',
    funding_agency: '',
    proposed_budget: '',
    status: 'Draft',
    remarks: '',
    approval_date: '',
    rejection_date: '',
    rejection_reason: ''
  });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<StatusUpdateData>({
    new_status: '' as ProposalStatus,
    remarks: '',
    update_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProposals();
    fetchEmployees();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/technical/proposals');
      setProposals(response.data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to fetch proposals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/technical/proposals/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees. Please try again.');
    }
  };

  const handleEdit = (proposal: Proposal | null) => {
    setEditingProposal(proposal);
    if (proposal) {
      setFormData({
        proposal_title: proposal.proposal_title,
        submitted_by: proposal.submitted_by,
        submission_date: proposal.submission_date,
        funding_agency: proposal.funding_agency,
        proposed_budget: proposal.proposed_budget.toString(),
        status: proposal.status as ProposalStatus,
        remarks: proposal.remarks || '',
        approval_date: proposal.approval_date || '',
        rejection_date: proposal.rejection_date || '',
        rejection_reason: proposal.rejection_reason || ''
      });
    } else {
      setFormData({
        proposal_title: '',
        submitted_by: 0,
        submission_date: '',
        funding_agency: '',
        proposed_budget: '',
        status: 'Draft',
        remarks: '',
        approval_date: '',
        rejection_date: '',
        rejection_reason: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProposal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error states
    setError(null);

    // Validate required fields
    const requiredFields = {
      proposal_title: 'Proposal Title',
      submitted_by: 'Submitted By',
      submission_date: 'Submission Date',
      funding_agency: 'Funding Agency',
      proposed_budget: 'Proposed Budget'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field as keyof FormData] || formData[field as keyof FormData] === '') {
        setError(`${label} is required`);
        return;
      }
    }

    // Validate budget
    const budget = parseFloat(formData.proposed_budget);
    if (isNaN(budget) || budget <= 0) {
      setError('Proposed Budget must be a positive number');
      return;
    }

    try {
      const proposalData = {
        ...formData,
        proposed_budget: budget
      };

      if (editingProposal) {
        await api.put(`/technical/proposals/${editingProposal.proposal_id}`, proposalData);
      } else {
        await api.post('/technical/proposals', proposalData);
      }

      handleCloseDialog();
      fetchProposals();
    } catch (err: any) {
      console.error('Error saving proposal:', err);
      setError(err.response?.data?.error || 'Failed to save proposal. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewProposal = () => {
    handleEdit(null);
  };

  const handleStatusUpdate = async () => {
    if (!selectedProposal || !statusUpdateData.new_status) {
      setError('Please select a new status');
      return;
    }

    if (!statusUpdateData.update_date) {
      setError('Please select a status change date');
      return;
    }

    try {
      await api.put(`/technical/proposals/${selectedProposal.proposal_id}/status`, {
        new_status: statusUpdateData.new_status,
        remarks: statusUpdateData.remarks,
        update_date: statusUpdateData.update_date
      });

      setStatusUpdateDialogOpen(false);
      setSelectedProposal(null);
      setStatusUpdateData({
        new_status: '' as ProposalStatus,
        remarks: '',
        update_date: new Date().toISOString().split('T')[0]
      });
      fetchProposals();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (proposalId: number) => {
    if (!window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/technical/proposals/${proposalId}`);
      fetchProposals();
    } catch (err: any) {
      console.error('Error deleting proposal:', err);
      setError(err.response?.data?.error || 'Failed to delete proposal. Please try again.');
    }
  };

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Submitted': return 'info';
      case 'Under Review': return 'warning';
      case 'Presented to Working Group': return 'warning';
      case 'Presented to Ministry': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const StatusHistoryDialog = ({ open, onClose, history }: { open: boolean; onClose: () => void; history: StatusHistory[] }) => {
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'N/A';
      try {
        return format(new Date(dateString), 'dd/MM/yyyy');
      } catch {
        return dateString;
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Status History</DialogTitle>
        <DialogContent>
          <List>
            {history.map((item, index) => (
              <React.Fragment key={item.history_id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="subtitle1">
                          {item.old_status} → {item.new_status}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(item.update_date)} {item.updated_by_name}
                        </Typography>
                        {item.remarks && (
                          <Typography variant="body2" color="text.secondary">
                            Remarks: {item.remarks}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < history.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const StatusUpdateDialog = () => (
    <Dialog open={statusUpdateDialogOpen} onClose={() => setStatusUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Update Proposal Status</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select
              value={statusUpdateData.new_status}
              onChange={(e) => setStatusUpdateData(prev => ({ ...prev, new_status: e.target.value as ProposalStatus }))}
              label="New Status"
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Status Change Date"
            type="date"
            value={statusUpdateData.update_date}
            onChange={(e) => setStatusUpdateData(prev => ({ ...prev, update_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Remarks"
            multiline
            rows={3}
            value={statusUpdateData.remarks}
            onChange={(e) => setStatusUpdateData(prev => ({ ...prev, remarks: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setStatusUpdateDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleStatusUpdate} variant="contained">Update Status</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading proposals...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Proposals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewProposal}
        >
          Add New Proposal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Submitted By</TableCell>
              <TableCell>Submission Date</TableCell>
              <TableCell>Funding Agency</TableCell>
              <TableCell>Budget (₹)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.proposal_id}>
                <TableCell>{proposal.proposal_title}</TableCell>
                <TableCell>{proposal.submitted_by_name}</TableCell>
                <TableCell>{format(new Date(proposal.submission_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{proposal.funding_agency}</TableCell>
                <TableCell>₹{proposal.proposed_budget.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={proposal.status}
                    color={getStatusColor(proposal.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1} alignItems="center">
                    <IconButton 
                      onClick={() => handleEdit(proposal)} 
                      size="small"
                      title="Edit Proposal"
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setHistoryDialogOpen(true);
                      }} 
                      size="small"
                      title="View Status History"
                      sx={{ color: 'info.main' }}
                    >
                      <TimelineIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setStatusUpdateDialogOpen(true);
                      }} 
                      size="small"
                      title="Update Status"
                      sx={{ color: 'warning.main' }}
                    >
                      <UpdateIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(proposal.proposal_id)} 
                      size="small"
                      title="Delete Proposal"
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProposal ? 'Edit Proposal' : 'Add New Proposal'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Proposal Title"
                name="proposal_title"
                value={formData.proposal_title}
                onChange={handleInputChange}
                required
              />
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.employee_name}
                value={employees.find(emp => emp.employee_id === formData.submitted_by) || null}
                onChange={(_, newValue) => setFormData({ 
                  ...formData, 
                  submitted_by: newValue ? newValue.employee_id : 0 
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Submitted By"
                    required
                  />
                )}
              />
              <TextField
                fullWidth
                label="Submission Date"
                name="submission_date"
                type="date"
                value={formData.submission_date}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Funding Agency</InputLabel>
                <Select
                  name="funding_agency"
                  value={formData.funding_agency}
                  onChange={handleSelectChange}
                  label="Funding Agency"
                  required
                >
                  {fundingAgencyOptions.map((agency) => (
                    <MenuItem key={agency} value={agency}>{agency}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Proposed Budget (₹)"
                name="proposed_budget"
                type="number"
                value={formData.proposed_budget}
                onChange={handleInputChange}
                required
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Status"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                multiline
                rows={3}
                value={formData.remarks}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                label="Approval Date"
                name="approval_date"
                type="date"
                value={formData.approval_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Rejection Date"
                name="rejection_date"
                type="date"
                value={formData.rejection_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Rejection Reason"
                name="rejection_reason"
                multiline
                rows={2}
                value={formData.rejection_reason}
                onChange={handleInputChange}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProposal ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Status History Dialog */}
      <StatusHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        history={selectedProposal?.status_history || []}
      />

      {/* Status Update Dialog */}
      <StatusUpdateDialog />
    </Box>
  );
};

export default Proposals; 