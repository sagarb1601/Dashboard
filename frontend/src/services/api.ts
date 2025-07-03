import axios from 'axios';

// Create an axios instance with default config
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// HR API functions
export const hrAPI = {
  // Get all employees
  getEmployees: () => api.get('/hr/employees'),
  
  // Get all designations
  getDesignations: () => api.get('/hr/designations'),
  
  // Get all technical groups
  getTechnicalGroups: () => api.get('/hr/technical_groups'),
  
  // Add new employee
  addEmployee: (employee: any) => api.post('/hr/employees', employee),
  
  // Update employee
  updateEmployee: (id: number, employee: any) => api.put(`/hr/employees/${id}`, employee),
  
  // Get employee by ID
  getEmployee: (id: number) => api.get(`/hr/employees/${id}`),

  // Bulk upload employees
  bulkUploadEmployees: (employees: any[]) => api.post('/hr/employees/bulk-upload', { employees }),

  // Get employees without technical group
  getEmployeesWithoutGroup: () => api.get('/hr/employees/without-group'),

  // Assign technical group to employee
  assignGroupToEmployee: (employeeId: number, technicalGroupId: number | null) => 
    api.put(`/hr/employees/${employeeId}/assign-group`, { technical_group_id: technicalGroupId })
};

// Technical Groups API functions
export const technicalGroupsAPI = {
  // Get all technical groups
  getTechnicalGroups: () => api.get('/technical-groups'),
  
  // Add new technical group
  addTechnicalGroup: (group: any) => api.post('/technical-groups', group)
}; 