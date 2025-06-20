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
  Autocomplete,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
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
  group_id?: number;
  group_name?: string;
  publication_scope?: 'National' | 'International';
  impact_factor?: number;
  internal_authors?: number[];
  external_authors?: string[];
}

interface Project {
  project_id: number;
  project_name: string;
}

interface Employee {
  employee_id: number;
  employee_name: string;
  technical_group_id?: number;
}

const validationSchema = yup.object({
  project_id: yup.string().required('Project is required'),
  type: yup.string().required('Publication type is required'),
  title: yup.string().required('Title is required'),
  details: yup.string().required('Details are required'),
  publication_date: yup.string().required('Publication date is required'),
  doi: yup.string(),
  publication_scope: yup.string().oneOf(['National', 'International'], 'Please select National or International'),
  impact_factor: yup.number().nullable().min(0, 'Impact factor must be positive'),
  internal_authors: yup.array().of(yup.number()),
  external_authors: yup.array().of(yup.string()),
});

const Publications = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newExternalAuthor, setNewExternalAuthor] = useState('');

  const formik = useFormik({
    initialValues: {
      project_id: '',
      type: '',
      title: '',
      details: '',
      publication_date: '',
      doi: '',
      publication_scope: '' as 'National' | 'International' | '',
      impact_factor: '',
      internal_authors: [] as number[],
      external_authors: [] as string[],
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        // Clear any previous error/success messages
        setError(null);
        setSuccess(null);
        
        const url = editingPublication 
          ? `/project-publications/${editingPublication.publication_id}`
          : '/project-publications';

        const response = editingPublication
          ? await api.put(url, values)
          : await api.post(url, values);

        if (response.status === 200 || response.status === 201) {
          setSuccess(`Publication ${editingPublication ? 'updated' : 'created'} successfully`);
          // Fetch publications and handle any errors separately
          try {
            await fetchPublications();
          } catch (fetchError: any) {
            console.error('Error fetching publications after save:', fetchError);
            // Don't override the success message for creation/update
          }
          handleClose();
        }
      } catch (error: any) {
        console.error('Error saving publication:', error);
        setError(error.response?.data?.error || `Failed to ${editingPublication ? 'update' : 'create'} publication`);
        setSuccess(null); // Clear success message if there's an error
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
      setSuccess(null);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/project-status/projects');
      setProjects(response.data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.response?.data?.error || 'Failed to fetch projects');
      setSuccess(null);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/project-publications/employees');
      setEmployees(response.data);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      setError(error.response?.data?.error || 'Failed to fetch employees');
      setSuccess(null);
    }
  };

  useEffect(() => {
    fetchPublications();
    fetchProjects();
    fetchEmployees();
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
      doi: publication.doi || '',
      publication_scope: publication.publication_scope || '',
      impact_factor: publication.impact_factor ? publication.impact_factor.toString() : '',
      internal_authors: publication.internal_authors || [],
      external_authors: publication.external_authors || [],
    });
    setOpen(true);
  };

  const getCombinedAuthorNames = (publication: Publication) => {
    const internalNames = publication.internal_authors?.map(id => 
      employees.find(emp => emp.employee_id === id)?.employee_name
    ).filter(name => name) || [];
    
    const externalNames = publication.external_authors || [];
    
    const allNames = [...internalNames, ...externalNames];
    return allNames.length > 0 ? allNames.join(', ') : publication.authors || 'No authors';
  };

  const handleDelete = async (publicationId: number) => {
    try {
      const response = await api.delete(`/project-publications/${publicationId}`);
      if (response.status === 200) {
        setSuccess('Publication deleted successfully');
        setError(null);
        fetchPublications();
      }
    } catch (error: any) {
      console.error('Error deleting publication:', error);
      setError(error.response?.data?.error || 'Failed to delete publication');
      setSuccess(null);
    }
  };

  const handleAddExternalAuthor = () => {
    if (newExternalAuthor.trim()) {
      const currentAuthors = formik.values.external_authors;
      formik.setFieldValue('external_authors', [...currentAuthors, newExternalAuthor.trim()]);
      setNewExternalAuthor('');
    }
  };

  const handleRemoveExternalAuthor = (index: number) => {
    const currentAuthors = formik.values.external_authors;
    const updatedAuthors = currentAuthors.filter((_, i) => i !== index);
    formik.setFieldValue('external_authors', updatedAuthors);
  };

  const getImpactFactorLabel = () => {
    return formik.values.type === 'Conference' ? 'Conference Rank' : 'Impact Factor';
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
                  <TableCell>Scope</TableCell>
                  <TableCell>Impact Factor/Conference Rank</TableCell>
                  <TableCell>Authors</TableCell>
                  <TableCell>DOI</TableCell>
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
                    <TableCell>{publication.publication_scope}</TableCell>
                    <TableCell>
                      {publication.impact_factor ? (
                        <Typography variant="body2">
                          {publication.type === 'Conference' ? 'Rank: ' : 'IF: '}
                          {publication.impact_factor}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getCombinedAuthorNames(publication)}</TableCell>
                    <TableCell>{publication.doi}</TableCell>
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
                    <MenuItem value="Conference">Conference</MenuItem>
                    <MenuItem value="Workshop">Workshop</MenuItem>
                    <MenuItem value="Book Chapter">Book Chapter</MenuItem>
                    <MenuItem value="Technical Report">Technical Report</MenuItem>
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
                  name="doi"
                  label="DOI"
                  value={formik.values.doi}
                  onChange={formik.handleChange}
                  error={formik.touched.doi && Boolean(formik.errors.doi)}
                  helperText={formik.touched.doi && formik.errors.doi}
                />

                <FormControl fullWidth>
                  <InputLabel>Publication Scope</InputLabel>
                  <Select
                    name="publication_scope"
                    value={formik.values.publication_scope}
                    onChange={formik.handleChange}
                    error={formik.touched.publication_scope && Boolean(formik.errors.publication_scope)}
                    label="Publication Scope"
                  >
                    <MenuItem value="National">National</MenuItem>
                    <MenuItem value="International">International</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  name="impact_factor"
                  label={getImpactFactorLabel()}
                  type="number"
                  value={formik.values.impact_factor}
                  onChange={formik.handleChange}
                  error={formik.touched.impact_factor && Boolean(formik.errors.impact_factor)}
                  helperText={formik.touched.impact_factor && formik.errors.impact_factor}
                />

                <Autocomplete
                  multiple
                  options={employees}
                  getOptionLabel={(option) => `${option.employee_name} (${option.employee_id})`}
                  value={employees.filter(emp => formik.values.internal_authors.includes(emp.employee_id))}
                  onChange={(_, newValue) => {
                    const selectedIds = newValue.map(emp => emp.employee_id);
                    formik.setFieldValue('internal_authors', selectedIds);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Internal Authors"
                      placeholder="Search and select employees..."
                      error={formik.touched.internal_authors && Boolean(formik.errors.internal_authors)}
                      helperText={formik.touched.internal_authors && formik.errors.internal_authors}
                    />
                  )}
                  filterOptions={(options, { inputValue }) => {
                    return options.filter(option =>
                      option.employee_name.toLowerCase().includes(inputValue.toLowerCase()) ||
                      option.employee_id.toString().includes(inputValue)
                    );
                  }}
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    External Authors
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        label="Add External Author"
                        value={newExternalAuthor}
                        onChange={(e) => setNewExternalAuthor(e.target.value)}
                        placeholder="Enter author name"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddExternalAuthor();
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleAddExternalAuthor}
                        disabled={!newExternalAuthor.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formik.values.external_authors.map((author, index) => (
                        <Chip
                          key={index}
                          label={author}
                          onDelete={() => handleRemoveExternalAuthor(index)}
                          deleteIcon={<CloseIcon />}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Stack>
                </Box>
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