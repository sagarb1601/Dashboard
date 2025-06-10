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

interface Publication {
  publication_id: number;
  project_id: number;
  type: string;
  title: string;
  details: string;
  publication_date: string;
  authors: string;
  doi: string;
  created_at: string;
}

interface Project {
  project_id: number;
  project_name: string;
}

const validationSchema = yup.object({
  project_id: yup.string().required('Project is required'),
  type: yup.string().required('Publication type is required'),
  title: yup.string().required('Title is required'),
  details: yup.string().required('Details are required'),
  publication_date: yup.string().required('Publication date is required'),
  authors: yup.string().required('Authors are required'),
  doi: yup.string(),
});

const Publications = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      project_id: '',
      type: '',
      title: '',
      details: '',
      publication_date: '',
      authors: '',
      doi: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const url = editingPublication 
          ? `/project-publications/${editingPublication.publication_id}`
          : '/project-publications';

        const response = editingPublication
          ? await api.put(url, values)
          : await api.post(url, values);

        if (response.status === 200 || response.status === 201) {
          setSuccess(`Publication ${editingPublication ? 'updated' : 'created'} successfully`);
          fetchPublications();
          handleClose();
        }
      } catch (error: any) {
        console.error('Error saving publication:', error);
        setError(error.response?.data?.error || `Failed to ${editingPublication ? 'update' : 'create'} publication`);
      }
    },
  });

  const fetchPublications = async () => {
    try {
      const response = await api.get('/project-publications');
      setPublications(response.data);
    } catch (error: any) {
      console.error('Error fetching publications:', error);
      setError(error.response?.data?.error || 'Failed to fetch publications');
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
    fetchPublications();
    fetchProjects();
  }, []);

  const handleClickOpen = () => {
    setEditingPublication(null);
    formik.resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPublication(null);
    formik.resetForm();
  };

  const handleEdit = (publication: Publication) => {
    setEditingPublication(publication);
    formik.setValues({
      project_id: publication.project_id.toString(),
      type: publication.type,
      title: publication.title,
      details: publication.details,
      publication_date: publication.publication_date.split('T')[0],
      authors: publication.authors,
      doi: publication.doi || '',
    });
    setOpen(true);
  };

  const handleDelete = async (publicationId: number) => {
    try {
      const response = await api.delete(`/project-publications/${publicationId}`);
      if (response.status === 200) {
        setSuccess('Publication deleted successfully');
        fetchPublications();
      }
    } catch (error: any) {
      console.error('Error deleting publication:', error);
      setError(error.response?.data?.error || 'Failed to delete publication');
    }
  };

  return (
    <DashboardLayout>
      <Box p={3}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Project Publications</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
            >
              Add Publication
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Publication Date</TableCell>
                  <TableCell>Authors</TableCell>
                  <TableCell>DOI</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {publications.map((publication) => (
                  <TableRow key={publication.publication_id}>
                    <TableCell>
                      {projects.find(p => p.project_id === publication.project_id)?.project_name}
                    </TableCell>
                    <TableCell>{publication.type}</TableCell>
                    <TableCell>{publication.title}</TableCell>
                    <TableCell>{publication.details}</TableCell>
                    <TableCell>{new Date(publication.publication_date).toLocaleDateString()}</TableCell>
                    <TableCell>{publication.authors}</TableCell>
                    <TableCell>{publication.doi}</TableCell>
                    <TableCell>{new Date(publication.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(publication)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(publication.publication_id)} color="error">
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
            <DialogTitle>{editingPublication ? 'Edit Publication' : 'Add New Publication'}</DialogTitle>
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
                  <InputLabel>Publication Type</InputLabel>
                  <Select
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    error={formik.touched.type && Boolean(formik.errors.type)}
                    label="Publication Type"
                  >
                    <MenuItem value="Journal">Journal</MenuItem>
                    <MenuItem value="Publication">Publication</MenuItem>
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
                  name="details"
                  label="Conference/Journal Details"
                  multiline
                  rows={4}
                  value={formik.values.details}
                  onChange={formik.handleChange}
                  error={formik.touched.details && Boolean(formik.errors.details)}
                  helperText={formik.touched.details && formik.errors.details}
                />

                <TextField
                  fullWidth
                  name="publication_date"
                  label="Publication Date"
                  type="date"
                  value={formik.values.publication_date}
                  onChange={formik.handleChange}
                  error={formik.touched.publication_date && Boolean(formik.errors.publication_date)}
                  helperText={formik.touched.publication_date && formik.errors.publication_date}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  name="authors"
                  label="Authors"
                  value={formik.values.authors}
                  onChange={formik.handleChange}
                  error={formik.touched.authors && Boolean(formik.errors.authors)}
                  helperText={formik.touched.authors && formik.errors.authors}
                />

                <TextField
                  fullWidth
                  name="doi"
                  label="DOI"
                  value={formik.values.doi}
                  onChange={formik.handleChange}
                  error={formik.touched.doi && Boolean(formik.errors.doi)}
                  helperText={formik.touched.doi && formik.errors.doi}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingPublication ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default Publications; 