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
  IconButton,
  Tooltip,
  Stack,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../../utils/api';
import { format } from 'date-fns';
import { Dayjs } from 'dayjs';

interface Agreement {
  id: number;
  agreement_type: string;
  agreement_category: string;
  agreement_subtype: string;
  duration_months: number;
  title: string;
  thematic_areas: string[];
  cdac_centres: string[];
  signing_agency: string;
  funding_source: string;
  total_value: number;
  scope: string;
  profile: string;
  legacy_status: string;
  signed_date: string;
  start_date: string;
  end_date: string;
  level: string;
  objectives: string;
  spoc_id: number;
  spoc_name: string;
  status: string;
}

interface Activity {
  id: number;
  activity_type: string;
  status: string;
  description: string;
  created_by_name: string;
  created_at: string;
}

interface LookupData {
  thematicAreas: { id: number; name: string; }[];
  cdacCentres: { id: number; name: string; }[];
}

interface ThematicArea {
  id: number;
  name: string;
}

interface CdacCentre {
  id: number;
  name: string;
}

const AGREEMENT_TYPES = ['MOU', 'MOA', 'IOA', 'NDA', 'SLA', 'Others'];
const AGREEMENT_CATEGORIES = ['Academic training', 'R&D', 'Commercial', 'ToT', 'Service', 'Funded projects'];
const AGREEMENT_SUBTYPES = ['Biparty', 'Triparty'];
const LEGACY_STATUSES = ['Central govt', 'State govt', 'Academia', 'R&D', 'NGO', 'Private'];
const AGREEMENT_LEVELS = ['National', 'International'];
const AGREEMENT_STATUSES = ['Active', 'Completed', 'Terminated'];

const Agreements: React.FC = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openActivitiesDialog, setOpenActivitiesDialog] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupData, setLookupData] = useState<LookupData>({ thematicAreas: [], cdacCentres: [] });
  const [employees, setEmployees] = useState<{ employee_id: number; employee_name: string; }[]>([]);
  const [newActivity, setNewActivity] = useState({ activity_type: 'Activity Update', status: '', description: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    agreement_type: '',
    agreement_category: '',
    agreement_subtype: '',
    duration_months: 0,
    title: '',
    thematic_area_ids: [] as number[],
    cdac_centre_ids: [] as number[],
    signing_agency: '',
    funding_source: '',
    total_value: 0,
    scope: '',
    profile: '',
    legacy_status: '',
    signed_date: null as Date | null,
    start_date: null as Date | null,
    end_date: null as Date | null,
    level: '',
    objectives: '',
    spoc_id: 0,
    status: 'Active'
  });

  useEffect(() => {
    fetchAgreements();
    fetchLookupData();
    fetchEmployees();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/business/agreements');
      setAgreements(response.data);
    } catch (error) {
      setError('Failed to fetch agreements');
      console.error('Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const response = await api.get('/business/agreements/lookup/data');
      setLookupData(response.data);
    } catch (error) {
      console.error('Error fetching lookup data:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/hr/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchActivities = async (agreementId: number) => {
    try {
      const response = await api.get(`/business/agreements/${agreementId}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);

      const payload = {
        ...formData,
        signed_date: formData.signed_date ? format(formData.signed_date, 'yyyy-MM-dd') : null,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null
      };

      if (selectedAgreement) {
        await api.put(`/business/agreements/${selectedAgreement.id}`, payload);
        setSuccess('Agreement updated successfully');
      } else {
        await api.post('/business/agreements', payload);
        setSuccess('Agreement created successfully');
      }

      handleCloseDialog();
      fetchAgreements();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save agreement');
    }
  };

  const handleAddActivity = async () => {
    try {
      if (!selectedAgreement) return;

      await api.post(`/business/agreements/${selectedAgreement.id}/activities`, newActivity);
      setSuccess('Activity added successfully');
      fetchActivities(selectedAgreement.id);
      
      // If this was a status change activity, refresh the agreements list
      if (newActivity.activity_type === 'Status Change') {
        fetchAgreements();
      }
      
      setNewActivity({ activity_type: 'Activity Update', status: '', description: '' });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to add activity');
    }
  };

  const handleOpenDialog = (agreement?: Agreement) => {
    if (agreement) {
      setSelectedAgreement(agreement);
      setFormData({
        ...agreement,
        thematic_area_ids: lookupData.thematicAreas
          .filter(ta => agreement.thematic_areas.includes(ta.name))
          .map(ta => ta.id),
        cdac_centre_ids: lookupData.cdacCentres
          .filter(cc => agreement.cdac_centres.includes(cc.name))
          .map(cc => cc.id),
        signed_date: new Date(agreement.signed_date),
        start_date: new Date(agreement.start_date),
        end_date: new Date(agreement.end_date)
      });
    } else {
      setSelectedAgreement(null);
      setFormData({
        agreement_type: '',
        agreement_category: '',
        agreement_subtype: '',
        duration_months: 0,
        title: '',
        thematic_area_ids: [],
        cdac_centre_ids: [],
        signing_agency: '',
        funding_source: '',
        total_value: 0,
        scope: '',
        profile: '',
        legacy_status: '',
        signed_date: null,
        start_date: null,
        end_date: null,
        level: '',
        objectives: '',
        spoc_id: 0,
        status: 'Active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAgreement(null);
    setError(null);
    setSuccess(null);
  };

  const handleOpenActivities = async (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    await fetchActivities(agreement.id);
    setOpenActivitiesDialog(true);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Agreements</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Agreement
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Signing Agency</TableCell>
              <TableCell>SPOC</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agreements
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell>{agreement.title}</TableCell>
                  <TableCell>{agreement.agreement_type}</TableCell>
                  <TableCell>{agreement.agreement_category}</TableCell>
                  <TableCell>{agreement.signing_agency}</TableCell>
                  <TableCell>{agreement.spoc_name}</TableCell>
                  <TableCell>{agreement.status}</TableCell>
                  <TableCell>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(agreement)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Activities">
                        <IconButton onClick={() => handleOpenActivities(agreement)}>
                          <TimelineIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={agreements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Agreement Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAgreement ? 'Edit Agreement' : 'Add Agreement'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Agreement Type</InputLabel>
                <Select
                  value={formData.agreement_type}
                  label="Agreement Type"
                  onChange={(e) => setFormData({ ...formData, agreement_type: e.target.value })}
                >
                  {AGREEMENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Agreement Category</InputLabel>
                <Select
                  value={formData.agreement_category}
                  label="Agreement Category"
                  onChange={(e) => setFormData({ ...formData, agreement_category: e.target.value })}
                >
                  {AGREEMENT_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Agreement Subtype</InputLabel>
              <Select
                value={formData.agreement_subtype}
                label="Agreement Subtype"
                onChange={(e) => setFormData({ ...formData, agreement_subtype: e.target.value })}
              >
                {AGREEMENT_SUBTYPES.map((subtype) => (
                  <MenuItem key={subtype} value={subtype}>{subtype}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Duration (months)"
              value={formData.duration_months}
              onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
            />
            <Autocomplete<ThematicArea, true>
              multiple
              options={lookupData.thematicAreas}
              getOptionLabel={(option: ThematicArea) => option.name}
              value={lookupData.thematicAreas.filter(ta => formData.thematic_area_ids.includes(ta.id))}
              onChange={(_, newValue: ThematicArea[]) => setFormData({
                ...formData,
                thematic_area_ids: newValue.map(v => v.id)
              })}
              renderInput={(params) => (
                <TextField {...params} label="Thematic Areas" />
              )}
            />
            <Autocomplete<CdacCentre, true>
              multiple
              options={lookupData.cdacCentres}
              getOptionLabel={(option: CdacCentre) => option.name}
              value={lookupData.cdacCentres.filter(cc => formData.cdac_centre_ids.includes(cc.id))}
              onChange={(_, newValue: CdacCentre[]) => setFormData({
                ...formData,
                cdac_centre_ids: newValue.map(v => v.id)
              })}
              renderInput={(params) => (
                <TextField {...params} label="CDAC Centres" />
              )}
            />
            <TextField
              fullWidth
              label="Signing Agency"
              value={formData.signing_agency}
              onChange={(e) => setFormData({ ...formData, signing_agency: e.target.value })}
            />
            <TextField
              fullWidth
              label="Funding Source"
              value={formData.funding_source}
              onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
            />
            <TextField
              fullWidth
              type="number"
              label="Total Value"
              value={formData.total_value}
              onChange={(e) => setFormData({ ...formData, total_value: parseFloat(e.target.value) })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Scope"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Profile"
              value={formData.profile}
              onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Legacy Status</InputLabel>
              <Select
                value={formData.legacy_status}
                label="Legacy Status"
                onChange={(e) => setFormData({ ...formData, legacy_status: e.target.value })}
              >
                {LEGACY_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={formData.level}
                label="Level"
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                {AGREEMENT_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ width: '100%' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Signed Date"
                    value={formData.signed_date}
                    onChange={(date) => setFormData({ ...formData, signed_date: date ? (date as Dayjs).toDate() : null })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>
              <Box sx={{ width: '100%' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.start_date}
                    onChange={(date) => setFormData({ ...formData, start_date: date ? (date as Dayjs).toDate() : null})}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>
              <Box sx={{ width: '100%' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.end_date}
                    onChange={(date) => setFormData({ ...formData, end_date: date ? (date as Dayjs).toDate() : null})}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>
            </Stack>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Objectives"
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>SPOC</InputLabel>
              <Select
                value={formData.spoc_id}
                label="SPOC"
                onChange={(e) => setFormData({ ...formData, spoc_id: e.target.value as number })}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.employee_id} value={emp.employee_id}>
                    {emp.employee_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {AGREEMENT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedAgreement ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activities Dialog */}
      <Dialog open={openActivitiesDialog} onClose={() => setOpenActivitiesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Activities</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add New Activity</Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    value={newActivity.activity_type}
                    label="Activity Type"
                    onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                  >
                    <MenuItem value="Activity Update">Activity Update</MenuItem>
                    <MenuItem value="Status Change">Status Change</MenuItem>
                  </Select>
                </FormControl>
                {newActivity.activity_type === 'Status Change' && (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={newActivity.status}
                      label="Status"
                      onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value })}
                    >
                      {AGREEMENT_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Stack>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              />
              <Box>
                <Button
                  variant="contained"
                  onClick={handleAddActivity}
                  disabled={!newActivity.description || (newActivity.activity_type === 'Status Change' && !newActivity.status)}
                >
                  Add Activity
                </Button>
              </Box>
            </Stack>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>Activity History</Typography>
          {activities.map((activity) => (
            <Paper key={activity.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1">
                  {activity.activity_type}
                  {activity.status && ` - ${activity.status}`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {new Date(activity.created_at).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body1">{activity.description}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                By: {activity.created_by_name}
              </Typography>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActivitiesDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Agreements; 