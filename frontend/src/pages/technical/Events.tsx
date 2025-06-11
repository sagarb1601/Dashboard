import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';

interface Event {
  event_id: number;
  project_id: number;
  event_type: string;
  title: string;
  start_date: string;
  end_date: string;
  participants_count: number;
  venue: string;
  created_at: string;
}

interface Project {
  project_id: number;
  project_name: string;
}

const validationSchema = yup.object({
  project_id: yup.string().required('Project is required'),
  event_type: yup.string().required('Event type is required'),
  title: yup.string().required('Title is required'),
  start_date: yup.string().required('Start date is required'),
  end_date: yup.string().required('End date is required'),
  participants_count: yup.string().required('Participants count is required'),
  venue: yup.string().required('Venue is required'),
});

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      project_id: '',
      event_type: '',
      title: '',
      start_date: '',
      end_date: '',
      participants_count: '',
      venue: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const url = editingEvent 
          ? `/project-events/${editingEvent.event_id}`
          : '/project-events';

        const response = editingEvent
          ? await api.put(url, values)
          : await api.post(url, values);

        if (response.status === 200 || response.status === 201) {
          setSuccess(`Event ${editingEvent ? 'updated' : 'created'} successfully`);
          fetchEvents();
          handleClose();
        }
      } catch (error: any) {
        console.error('Error saving event:', error);
        setError(error.response?.data?.error || `Failed to ${editingEvent ? 'update' : 'create'} event`);
      }
    },
  });

  const fetchEvents = async () => {
    try {
      const response = await api.get('/project-events');
      setEvents(response.data);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.response?.data?.error || 'Failed to fetch events');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/project-status/projects');
      setProjects(response.data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.response?.data?.error || 'Failed to fetch projects');
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchProjects();
  }, []);

  const handleClickOpen = () => {
    setEditingEvent(null);
    formik.resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEvent(null);
    formik.resetForm();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    formik.setValues({
      project_id: event.project_id.toString(),
      event_type: event.event_type,
      title: event.title,
      start_date: event.start_date.split('T')[0],
      end_date: event.end_date.split('T')[0],
      participants_count: event.participants_count.toString(),
      venue: event.venue,
    });
    setOpen(true);
  };

  const handleDelete = async (eventId: number) => {
    try {
      const response = await api.delete(`/project-events/${eventId}`);
      if (response.status === 200) {
        setSuccess('Event deleted successfully');
        fetchEvents();
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setError(error.response?.data?.error || 'Failed to delete event');
    }
  };

  return (
    <DashboardLayout>
      <Box p={3}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Project Events</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
            >
              Add Event
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell>Venue</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.event_id}>
                    <TableCell>
                      {projects.find(p => p.project_id === event.project_id)?.project_name}
                    </TableCell>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{new Date(event.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(event.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{event.participants_count}</TableCell>
                    <TableCell>{event.venue}</TableCell>
                    <TableCell>{new Date(event.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(event)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(event.event_id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Project</InputLabel>
                  <Select
                    name="project_id"
                    value={formik.values.project_id}
                    onChange={formik.handleChange}
                    error={formik.touched.project_id && Boolean(formik.errors.project_id)}
                    label="Project"
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    name="event_type"
                    value={formik.values.event_type}
                    onChange={formik.handleChange}
                    error={formik.touched.event_type && Boolean(formik.errors.event_type)}
                    label="Event Type"
                  >
                    <MenuItem value="Workshop">Workshop</MenuItem>
                    <MenuItem value="Conference">Conference</MenuItem>
                    <MenuItem value="Training">Training</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  name="title"
                  label="Title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                />

                <TextField
                  fullWidth
                  name="start_date"
                  label="Start Date"
                  type="date"
                  value={formik.values.start_date}
                  onChange={formik.handleChange}
                  error={formik.touched.start_date && Boolean(formik.errors.start_date)}
                  helperText={formik.touched.start_date && formik.errors.start_date}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  name="end_date"
                  label="End Date"
                  type="date"
                  value={formik.values.end_date}
                  onChange={formik.handleChange}
                  error={formik.touched.end_date && Boolean(formik.errors.end_date)}
                  helperText={formik.touched.end_date && formik.errors.end_date}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  name="participants_count"
                  label="Participants Count"
                  type="number"
                  value={formik.values.participants_count}
                  onChange={formik.handleChange}
                  error={formik.touched.participants_count && Boolean(formik.errors.participants_count)}
                  helperText={formik.touched.participants_count && formik.errors.participants_count}
                />

                <TextField
                  fullWidth
                  name="venue"
                  label="Venue"
                  value={formik.values.venue}
                  onChange={formik.handleChange}
                  error={formik.touched.venue && Boolean(formik.errors.venue)}
                  helperText={formik.touched.venue && formik.errors.venue}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default Events; 