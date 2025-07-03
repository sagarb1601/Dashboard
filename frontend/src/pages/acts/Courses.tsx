import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface Course {
  id: number;
  course_name: string;
  batch_name: string;
  batch_id: string;
  batch_type: string;
  year: number;
  status: string;
  students_enrolled: number;
  students_placed: number;
  course_fee: number;
}

interface CoursesProps {
  hideAddButton?: boolean;
}

const COURSE_OPTIONS = ['PG-DUASP', 'PG-DITISS', 'PG-DESD', 'PG-DBDA', 'PG-DAC', 'PG-DIOT'];
const BATCH_TYPE_OPTIONS = ['February', 'August'];
const STATUS_OPTIONS = ['ongoing', 'completed'];

const Courses: React.FC<CoursesProps> = ({ hideAddButton = false }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    course_name: '',
    batch_type: 'February',
    year: new Date().getFullYear(),
    status: 'ongoing',
    students_enrolled: 0,
    students_placed: 0,
    course_fee: 0,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/acts/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to fetch courses',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch courses',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpen = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        course_name: course.course_name,
        batch_type: course.batch_type,
        year: course.year,
        status: course.status,
        students_enrolled: course.students_enrolled,
        students_placed: course.students_placed,
        course_fee: course.course_fee,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        course_name: '',
        batch_type: 'February',
        year: new Date().getFullYear(),
        status: 'ongoing',
        students_enrolled: 0,
        students_placed: 0,
        course_fee: 0,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async () => {
    try {
      // Frontend validation
      if (formData.students_enrolled < 0) {
        setSnackbar({
          open: true,
          message: 'Students enrolled cannot be negative',
          severity: 'error'
        });
        return;
      }
      if (formData.students_placed < 0) {
        setSnackbar({
          open: true,
          message: 'Students placed cannot be negative',
          severity: 'error'
        });
        return;
      }
      if (formData.course_fee < 0) {
        setSnackbar({
          open: true,
          message: 'Course fee cannot be negative',
          severity: 'error'
        });
        return;
      }
      if (formData.students_placed > formData.students_enrolled) {
        setSnackbar({
          open: true,
          message: 'Students placed cannot be more than students enrolled',
          severity: 'error'
        });
        return;
      }

      const url = editingCourse 
        ? `/api/acts/courses/${editingCourse.id}`
        : '/api/acts/courses';
      
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingCourse ? 'Course updated successfully' : 'Course added successfully',
          severity: 'success'
        });
        handleClose();
        fetchCourses();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || 'Failed to save course',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save course',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`/api/acts/courses/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          setSnackbar({
            open: true,
            message: 'Course deleted successfully',
            severity: 'success'
          });
          fetchCourses();
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to delete course',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete course',
          severity: 'error'
        });
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ACTS Course Information
        </Typography>
        {!hideAddButton && (
          <Button variant="contained" color="primary" onClick={() => handleOpen()}>
            <AddIcon sx={{ mr: 1 }} />
            Add Course
          </Button>
        )}
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Name</TableCell>
              <TableCell>Batch ID</TableCell>
              <TableCell>Batch Type</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Students Enrolled</TableCell>
              <TableCell>Students Placed</TableCell>
              <TableCell>Course Fee</TableCell>
              {!hideAddButton && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.course_name}</TableCell>
                <TableCell>{course.batch_id}</TableCell>
                <TableCell>{course.batch_type}</TableCell>
                <TableCell>{course.year}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color: course.status === 'ongoing' ? '#1890ff' : '#52c41a',
                      fontWeight: 'bold'
                    }}
                  >
                    {course.status.toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>{course.students_enrolled}</TableCell>
                <TableCell>{course.students_placed}</TableCell>
                <TableCell>₹{course.course_fee.toLocaleString()}</TableCell>
                <TableCell>
                  {!hideAddButton && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpen(course)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(course.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Course Name</InputLabel>
              <Select
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                label="Course Name"
              >
                {COURSE_OPTIONS.map((course) => (
                  <MenuItem key={course} value={course}>
                    {course}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Batch Type</InputLabel>
              <Select
                value={formData.batch_type}
                onChange={(e) => setFormData({ ...formData, batch_type: e.target.value })}
                label="Batch Type"
              >
                {BATCH_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              fullWidth
              inputProps={{ min: 2020, max: 2030 }}
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Status"
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Students Enrolled"
              type="number"
              value={formData.students_enrolled}
              onChange={(e) => setFormData({ ...formData, students_enrolled: parseInt(e.target.value) })}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Students Placed"
              type="number"
              value={formData.students_placed}
              onChange={(e) => setFormData({ ...formData, students_placed: parseInt(e.target.value) })}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Course Fee (₹)"
              type="number"
              value={formData.course_fee}
              onChange={(e) => setFormData({ ...formData, course_fee: parseFloat(e.target.value) })}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingCourse ? 'Update' : 'Add'} Course
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Courses; 