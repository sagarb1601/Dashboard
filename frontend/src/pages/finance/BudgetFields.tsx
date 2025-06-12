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
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import DashboardLayout from '../../components/DashboardLayout';

interface Project {
  project_id: number;
  project_name: string;
}

interface BudgetField {
  field_id: number;
  field_name: string;
  is_default: boolean;
  created_at: string;
  is_selected?: boolean;
}

const validationSchema = yup.object({
  field_name: yup.string().required('Field name is required'),
});

const BudgetFields = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [budgetFields, setBudgetFields] = useState<BudgetField[]>([]);
  const [projectBudgetFields, setProjectBudgetFields] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      field_name: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!selectedProject) {
        setError('Please select a project first');
        return;
      }

      try {
        // First create the budget field
        const response = await fetch('http://localhost:5000/api/finance/budget-fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            field_name: values.field_name,
            is_default: false,
          }),
        });

        if (response.ok) {
          const newField = await response.json();
          
          // Then map it to the project
          const mappingResponse = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-fields`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              field_id: newField.field_id,
              is_custom: true,
            }),
          });

          if (mappingResponse.ok) {
            setSuccess('Budget field added successfully');
            fetchBudgetFields();
            fetchProjectBudgetFields();
            handleClose();
          } else {
            setError('Failed to map budget field to project');
          }
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to create budget field');
        }
      } catch (error) {
        console.error('Error saving budget field:', error);
        setError('Failed to create budget field');
      }
    },
  });

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/finance/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  };

  const fetchBudgetFields = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/finance/budget-fields', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBudgetFields(data);
      }
    } catch (error) {
      console.error('Error fetching budget fields:', error);
      setError('Failed to fetch budget fields');
    }
  };

  const fetchProjectBudgetFields = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-fields`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjectBudgetFields(data.map((item: any) => item.field_id));
      }
    } catch (error) {
      console.error('Error fetching project budget fields:', error);
      setError('Failed to fetch project budget fields');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchBudgetFields();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectBudgetFields();
    } else {
      setProjectBudgetFields([]);
    }
  }, [selectedProject]);

  const handleProjectChange = (event: any) => {
    setSelectedProject(event.target.value);
  };

  const handleClickOpen = () => {
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }
    formik.resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    formik.resetForm();
  };

  const handleFieldToggle = async (fieldId: number) => {
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }

    try {
      const method = projectBudgetFields.includes(fieldId) ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-fields${method === 'DELETE' ? `/${fieldId}` : ''}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        ...(method === 'POST' && {
          body: JSON.stringify({
            field_id: fieldId,
            is_custom: false,
          }),
        }),
      });

      if (response.ok) {
        setSuccess(`Budget field ${method === 'POST' ? 'added to' : 'removed from'} project`);
        fetchProjectBudgetFields();
      } else {
        setError(`Failed to ${method === 'POST' ? 'add' : 'remove'} budget field`);
      }
    } catch (error) {
      console.error('Error toggling budget field:', error);
      setError(`Failed to ${projectBudgetFields.includes(fieldId) ? 'remove' : 'add'} budget field`);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }

    setSaving(true);
    try {
      // First remove all existing mappings
      const existingFields = budgetFields.filter(field => projectBudgetFields.includes(field.field_id));
      for (const field of existingFields) {
        await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-fields/${field.field_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }

      // Then add all selected fields
      for (const fieldId of projectBudgetFields) {
        const field = budgetFields.find(f => f.field_id === fieldId);
        if (field) {
          await fetch(`http://localhost:5000/api/finance/projects/${selectedProject}/budget-fields`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              field_id: fieldId,
              is_custom: !field.is_default,
            }),
          });
        }
      }

      setSuccess('All budget fields saved successfully');
      fetchProjectBudgetFields();
    } catch (error) {
      console.error('Error saving budget fields:', error);
      setError('Failed to save budget fields');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}
      >
        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="h5" component="h1">Budget Fields</Typography>
            <Button
              variant="contained"
              onClick={handleClickOpen}
              startIcon={<AddIcon />}
            >
              Add Budget Field
            </Button>
          </Box>

          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              width: '100%'
            }}
          >
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={handleProjectChange}
                label="Select Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Configure Fields</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveAll}
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={projectBudgetFields.length === budgetFields.length}
                        indeterminate={projectBudgetFields.length > 0 && projectBudgetFields.length < budgetFields.length}
                        onChange={(event) => {
                          if (event.target.checked) {
                            handleSaveAll();
                          } else {
                            projectBudgetFields.forEach(fieldId => handleFieldToggle(fieldId));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Field Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budgetFields.map((field) => (
                    <TableRow key={field.field_id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={projectBudgetFields.includes(field.field_id)}
                          onChange={(event) => handleFieldToggle(field.field_id)}
                        />
                      </TableCell>
                      <TableCell>{field.field_name}</TableCell>
                      <TableCell>{field.is_default ? 'Default' : 'Custom'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleFieldToggle(field.field_id)}
                          color={projectBudgetFields.includes(field.field_id) ? 'error' : 'inherit'}
                          disabled={field.is_default}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>

        <Dialog open={open} onClose={handleClose}>
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle>Add Custom Budget Field</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="field_name"
                label="Field Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.field_name}
                onChange={formik.handleChange}
                error={formik.touched.field_name && Boolean(formik.errors.field_name)}
                helperText={formik.touched.field_name && formik.errors.field_name}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">Add Field</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default BudgetFields; 