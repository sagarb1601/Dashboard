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
  IconButton,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Course {
  id: number;
  course_name: string;
  batch_name: string;
  batch_id: string;
  year: number;
  students_enrolled: number;
  students_placed: number;
  course_fee: number;
}

const COURSE_OPTIONS = ['DSSD', 'DESD', 'DBA', 'DAC', 'DIOT', 'DHPC'];

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    course_name: '',
    batch_name: '',
    batch_id: '',
    year: new Date().getFullYear(),
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
      const response = await fetch('http://localhost:5000/api/acts/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpen = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData(course);
    } else {
      setEditingCourse(null);
      setFormData({
        course_name: '',
        batch_name: '',
        batch_id: '',
        year: new Date().getFullYear(),
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
      const url = editingCourse
        ? `http://localhost:5000/api/acts/courses/${editingCourse.id}`
        : 'http://localhost:5000/api/acts/courses';

      const response = await fetch(url, {
        method: editingCourse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingCourse ? 'Course updated successfully!' : 'Course added successfully!',
          severity: 'success'
        });
        handleClose();
        fetchCourses();
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'An error occurred while saving the course.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while saving the course.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/acts/courses/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>Courses Information</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add New Course
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Name</TableCell>
              <TableCell>Batch Name</TableCell>
              <TableCell>Batch ID</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Students Enrolled</TableCell>
              <TableCell>Students Placed</TableCell>
              <TableCell>Course Fee</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.course_name}</TableCell>
                <TableCell>{course.batch_name}</TableCell>
                <TableCell>{course.batch_id}</TableCell>
                <TableCell>{course.year}</TableCell>
                <TableCell>{course.students_enrolled}</TableCell>
                <TableCell>{course.students_placed}</TableCell>
                <TableCell>₹{course.course_fee.toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(course)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(course.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
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
            <TextField
              select
              label="Course Name"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              fullWidth
            >
              {COURSE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Batch Name"
              value={formData.batch_name}
              onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Batch ID"
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              fullWidth
            />
            <TextField
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Students Enrolled"
              type="number"
              value={formData.students_enrolled}
              onChange={(e) => setFormData({ ...formData, students_enrolled: parseInt(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Students Placed"
              type="number"
              value={formData.students_placed}
              onChange={(e) => setFormData({ ...formData, students_placed: parseInt(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Course Fee"
              type="number"
              value={formData.course_fee}
              onChange={(e) => setFormData({ ...formData, course_fee: parseFloat(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingCourse ? 'Update' : 'Add'}
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