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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
  Alert,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import DashboardLayout from '../../components/DashboardLayout';
import { Table as AntTable } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface Project {
  project_id: number;
  project_name: string;
  start_date: string;
  end_date: string;
  extension_end_date: string | null;
  total_value: number;
  funding_agency: string;
  duration_years: number;
  created_at: string;
  group_id: number;
  technical_group_name: string;
  reporting_type?: string;
}

interface TechnicalGroup {
  group_id: number;
  group_name: string;
}

const drawerWidth = 240;

const validationSchema = yup.object({
  project_name: yup.string().required('Project name is required'),
  start_date: yup.date().required('Start date is required'),
  end_date: yup.date()
    .required('End date is required')
    .min(yup.ref('start_date'), 'End date must be after start date'),
  extension_end_date: yup.date()
    .nullable()
    .min(yup.ref('end_date'), 'Extension date must be after end date'),
  total_value: yup.number()
    .required('Total value is required')
    .positive('Total value must be positive'),
  funding_agency: yup.string().required('Funding agency is required'),
  duration_years: yup.number()
    .required('Duration is required')
    .positive('Duration must be positive')
    .integer('Duration must be a whole number'),
  technical_group_id: yup.number()
    .required('Technical group is required')
    .positive('Please select a technical group'),
  // reporting_type: yup.string().required('Reporting type is required').oneOf(['FY', 'PQ'], 'Invalid reporting type')
});

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [technicalGroups, setTechnicalGroups] = useState<TechnicalGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [otherAgency, setOtherAgency] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      project_name: '',
      start_date: '',
      end_date: '',
      extension_end_date: '',
      total_value: '',
      funding_agency: 'MeitY',
      duration_years: 1,
      technical_group_id: '',
      // reporting_type: 'FY'
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const finalValues = {
          ...values,
          funding_agency: values.funding_agency === 'Others' ? otherAgency : values.funding_agency,
          extension_end_date: values.extension_end_date || null,
          total_value: Number(values.total_value),
          duration_years: Number(values.duration_years),
          group_id: Number(values.technical_group_id),
        };

        const url = editingProject 
          ? `http://localhost:5000/api/finance/projects/${editingProject.project_id}`
          : 'http://localhost:5000/api/finance/projects';

        const response = await fetch(url, {
          method: editingProject ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(finalValues),
        });

        if (response.ok) {
          setSuccess(`Project ${editingProject ? 'updated' : 'created'} successfully`);
          fetchProjects();
          handleClose();
        } else {
          const data = await response.json();
          setError(data.error || `Failed to ${editingProject ? 'update' : 'create'} project`);
        }
      } catch (error) {
        console.error('Error saving project:', error);
        setError(`Failed to ${editingProject ? 'update' : 'create'} project`);
      }
    },
  });

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/finance/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTechnicalGroups = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/hr/technical_groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTechnicalGroups(data);
      }
    } catch (error) {
      console.error('Error fetching technical groups:', error);
      setError('Failed to fetch technical groups');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTechnicalGroups();
  }, []);

  const handleClickOpen = () => {
    setEditingProject(null);
    formik.resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProject(null);
    formik.resetForm();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    formik.setValues({
      project_name: project.project_name,
      start_date: project.start_date.split('T')[0],
      end_date: project.end_date.split('T')[0],
      extension_end_date: project.extension_end_date ? project.extension_end_date.split('T')[0] : '',
      total_value: project.total_value.toString(),
      funding_agency: project.funding_agency,
      duration_years: project.duration_years,
      technical_group_id: project.group_id?.toString() || '',
      // reporting_type: project.reporting_type || 'FY'
    });
    setOpen(true);
  };

  const handleDelete = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setSuccess('Project deleted successfully');
        fetchProjects();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  const columns: ColumnsType<Project> = [
    { title: 'Project Name', dataIndex: 'project_name', key: 'project_name' },
    { title: 'Group', dataIndex: 'technical_group_name', key: 'technical_group_name' },
    { title: 'Start Date', dataIndex: 'start_date', key: 'start_date', render: (date) => new Date(date).toLocaleDateString() },
    { title: 'End Date', dataIndex: 'end_date', key: 'end_date', render: (date) => new Date(date).toLocaleDateString() },
    { title: 'Total Value', dataIndex: 'total_value', key: 'total_value', render: (value) => `₹${value.toLocaleString()}` },
    { title: 'Funding Agency', dataIndex: 'funding_agency', key: 'funding_agency' },
    { title: 'Duration (Years)', dataIndex: 'duration_years', key: 'duration_years' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <IconButton onClick={() => handleEdit(record)} color="primary">
            <EditIcon />
          </IconButton>
         <IconButton onClick={() => handleDelete(record.project_id)} color="error">
            <DeleteIcon />
          </IconButton>

        </>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ 
        // height: '100%',
        // display: 'flex',
        // flexDirection: 'column',
        // position: "absolute",
        // zIndex: 1000,
        // left: `${drawerWidth}px`,
        p: 3
      }}>
        <Stack spacing={2} sx={{ flex: '0 0 auto' }}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h1">Projects</Typography>
            <Button
              variant="contained"
              onClick={handleClickOpen}
              startIcon={<AddIcon />}
            >
              Add Project
            </Button>
          </Box>
        </Stack>
        <Paper 
          elevation={0}
          sx={{ 
            mt: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            bgcolor: '#fff',
            p: 2
          }}
        >
          <AntTable
            columns={columns}
            dataSource={projects}
            rowKey="project_id"
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
            scroll={{ x: 'max-content' }}
            bordered
            size="middle"
          />
        </Paper>
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  id="project_name"
                  name="project_name"
                  label="Project Name"
                  value={formik.values.project_name}
                  onChange={formik.handleChange}
                  error={formik.touched.project_name && Boolean(formik.errors.project_name)}
                  helperText={formik.touched.project_name && formik.errors.project_name}
                />

                <FormControl fullWidth error={formik.touched.technical_group_id && Boolean(formik.errors.technical_group_id)}>
                  <InputLabel id="technical-group-label">Group</InputLabel>
                  <Select
                    labelId="technical-group-label"
                    id="technical_group_id"
                    name="technical_group_id"
                    value={formik.values.technical_group_id}
                    onChange={formik.handleChange}
                    label="Technical Group"
                  >
                    {technicalGroups.map((group) => (
                      <MenuItem key={group.group_id} value={group.group_id}>
                        {group.group_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.technical_group_id && formik.errors.technical_group_id && (
                    <Typography color="error" variant="caption">
                      {formik.errors.technical_group_id}
                    </Typography>
                  )}
                </FormControl>

                <TextField
                  fullWidth
                  id="start_date"
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
                  id="end_date"
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
                  id="extension_end_date"
                  name="extension_end_date"
                  label="Extension End Date (Optional)"
                  type="date"
                  value={formik.values.extension_end_date}
                  onChange={formik.handleChange}
                  error={formik.touched.extension_end_date && Boolean(formik.errors.extension_end_date)}
                  helperText={formik.touched.extension_end_date && formik.errors.extension_end_date}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  id="total_value"
                  name="total_value"
                  label="Total Value"
                  type="number"
                  value={formik.values.total_value}
                  onChange={formik.handleChange}
                  error={formik.touched.total_value && Boolean(formik.errors.total_value)}
                  helperText={formik.touched.total_value && formik.errors.total_value}
                  InputProps={{
                    startAdornment: <span>₹</span>,
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel id="funding-agency-label">Funding Agency</InputLabel>
                  <Select
                    labelId="funding-agency-label"
                    id="funding_agency"
                    name="funding_agency"
                    value={formik.values.funding_agency}
                    onChange={formik.handleChange}
                    error={formik.touched.funding_agency && Boolean(formik.errors.funding_agency)}
                  >
                    <MenuItem value="MeitY">MeitY</MenuItem>
                    <MenuItem value="DST">DST</MenuItem>
                    <MenuItem value="DRDO">DRDO</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>

                {formik.values.funding_agency === 'Others' && (
                  <TextField
                    fullWidth
                    id="other_agency"
                    label="Other Agency Name"
                    value={otherAgency}
                    onChange={(e) => setOtherAgency(e.target.value)}
                  />
                )}

                <TextField
                  fullWidth
                  id="duration_years"
                  name="duration_years"
                  label="Duration (Years)"
                  type="number"
                  value={formik.values.duration_years}
                  onChange={formik.handleChange}
                  error={formik.touched.duration_years && Boolean(formik.errors.duration_years)}
                  helperText={formik.touched.duration_years && formik.errors.duration_years}
                />

                {/*
                <FormControl fullWidth error={formik.touched.reporting_type && Boolean(formik.errors.reporting_type)}>
                  <InputLabel>Reporting Type</InputLabel>
                  <Select
                    name="reporting_type"
                    value={formik.values.reporting_type}
                    onChange={formik.handleChange}
                    label="Reporting Type"
                  >
                    <MenuItem value="FY">Financial Year</MenuItem>
                    <MenuItem value="PQ">Project Quarter</MenuItem>
                  </Select>
                  {formik.touched.reporting_type && formik.errors.reporting_type && (
                    <FormHelperText>{formik.errors.reporting_type}</FormHelperText>
                  )}
                </FormControl>
                */}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingProject ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default Projects;