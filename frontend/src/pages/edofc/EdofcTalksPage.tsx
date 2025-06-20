import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { getTalks, createTalk, updateTalk, deleteTalk } from '../../services/edoffice/talks';
import { Talk, TalkCreate, TalkUpdate } from '../../types/talk';
import DashboardLayout from '../../components/DashboardLayout';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const EdofcTalksPage: React.FC = () => {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState<TalkCreate>({
    speaker_name: '',
    topic_role: '',
    event_name: '',
    venue: '',
    talk_date: new Date().toISOString(),
  });
  const [selectedFY, setSelectedFY] = useState('2025-26');

  const fetchTalks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTalks();
      setTalks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching talks:', err);
      setError('Failed to fetch talks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTalks();
  }, [fetchTalks]);

  const handleOpenDialog = (talk?: Talk) => {
    if (talk) {
      setSelectedTalk(talk);
      const date = new Date(talk.talk_date);
      const dateString = date.toISOString().split('T')[0];
      setFormData({
        speaker_name: talk.speaker_name,
        topic_role: talk.topic_role,
        event_name: talk.event_name,
        venue: talk.venue,
        talk_date: dateString,
      });
    } else {
      setSelectedTalk(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        speaker_name: '',
        topic_role: '',
        event_name: '',
        venue: '',
        talk_date: today,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTalk(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    try {
      const date = new Date(formData.talk_date);
      date.setUTCHours(0, 0, 0, 0);
      
      const talkData = {
        ...formData,
        talk_date: date.toISOString(),
      };

      if (selectedTalk) {
        await updateTalk(selectedTalk.id, { ...talkData, id: selectedTalk.id });
        setSuccess('Talk updated successfully');
      } else {
        await createTalk(talkData);
        setSuccess('Talk added successfully');
      }
      handleCloseDialog();
      fetchTalks();
    } catch (err) {
      console.error('Error saving talk:', err);
      setError('Failed to save talk');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this talk?')) {
      try {
        await deleteTalk(id);
        setSuccess('Talk deleted successfully');
        fetchTalks();
      } catch (err) {
        console.error('Error deleting talk:', err);
        setError('Failed to delete talk');
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

  // Helper to get FY start and end
  const getFYRange = (fy: string) => {
    const [startYear, endYear] = fy.split('-');
    const start = new Date(`${startYear}-04-01T00:00:00.000Z`);
    const end = new Date(`20${endYear}-03-31T23:59:59.999Z`);
    return { start, end };
  };

  const financialYears = (() => {
    const years = [];
    const now = new Date();
    let year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    for (let i = 0; i < 5; i++) {
      years.push(`${year - i}-${(year - i + 1).toString().slice(-2)}`);
    }
    return years;
  })();

  const handleDownloadExcel = () => {
    const { start, end } = getFYRange(selectedFY);
    const filteredTalks = talks.filter(talk => {
      const date = new Date(talk.talk_date);
      return date >= start && date <= end;
    });

    // Prepare data: each talk is a block with headers
    let data: any[] = [];
    filteredTalks.forEach(talk => {
      data.push([
        ['YEAR', selectedFY],
        ['Name of the speaker', talk.speaker_name],
        ['Topic / Role', talk.topic_role],
        ['Name of the event where the talk was delivered', talk.event_name],
        ['Venue', talk.venue],
        ['Date', format(new Date(talk.talk_date), 'dd MMM yyyy')],
        [], // Empty row between talks
      ]);
    });
    // Flatten the array
    data = data.flat();

    // Convert to worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    // Set column widths for better appearance
    ws['!cols'] = [
      { wch: 35 },
      { wch: 40 }
    ];
    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Talks');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Talks_Report_${selectedFY}.xlsx`);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Talks Delivered</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Talk
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            select
            label="Financial Year"
            value={selectedFY}
            onChange={e => setSelectedFY(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {financialYears.map(fy => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </TextField>
          <Button variant="outlined" onClick={handleDownloadExcel}>
            Download Excel
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Speaker</TableCell>
                <TableCell>Topic/Role</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {talks
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((talk) => (
                  <TableRow key={talk.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        {talk.speaker_name}
                      </Box>
                    </TableCell>
                    <TableCell>{talk.topic_role}</TableCell>
                    <TableCell>{talk.event_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        {talk.venue}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon fontSize="small" color="action" />
                        {format(parseISO(talk.talk_date), 'dd MMM yyyy')}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(talk)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(talk.id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={talks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedTalk ? 'Edit Talk' : 'Add Talk'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Speaker Name"
                value={formData.speaker_name}
                onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Topic/Role"
                value={formData.topic_role}
                onChange={(e) => setFormData({ ...formData, topic_role: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Event Name"
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Talk Date"
                type="date"
                value={formData.talk_date}
                onChange={(e) => setFormData({ ...formData, talk_date: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {selectedTalk ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          message={success}
        />
      </Box>
    </DashboardLayout>
  );
};

export default EdofcTalksPage; 