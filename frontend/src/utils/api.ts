import axios from 'axios';
import { Staff, Salary } from '../types/staff';
import { Contractor, ContractorMapping } from '../types/contractor';
import type { Vehicle, VehicleCreate, VehicleServicing, VehicleServicingCreate, VehicleInsurance, VehicleInsuranceCreate } from '../types/vehicles';

const BASE_URL = 'http://localhost:5000/api';
export { BASE_URL };

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data || error.message,
      headers: error.config?.headers
    });
    return Promise.reject(error);
  }
);

export const contractors = {
  getAll: () => api.get<Contractor[]>('/admin/contractors'),
  create: (data: any) => api.post<Contractor>('/admin/contractors', data),
  update: (id: number, data: any) => api.put<Contractor>(`/admin/contractors/${id}`, data),
  delete: (id: number) => api.delete(`/admin/contractors/${id}`),
};

export const amcContracts = {
  getAll: () => api.get('/amc/contracts'),
  create: (data: any) => api.post('/amc/contracts', data),
  update: (id: number, data: any) => api.put(`/amc/contracts/${id}`, data),
  delete: (id: number) => api.delete(`/amc/contracts/${id}`),
};

type ContractorMappingCreate = {
  contractor_id: number;
  department_id: number;
  start_date: string;
  end_date: string;
};

export const mappings = {
  getAll: () => api.get<ContractorMapping[]>('/admin/contractors/mappings'),
  create: (data: ContractorMappingCreate) => api.post<ContractorMapping>('/admin/contractors/mappings', data),
  update: (id: number, data: Partial<ContractorMapping>) => api.put<ContractorMapping>(`/admin/contractors/mappings/${id}`, data),
  delete: (id: number) => api.delete(`/admin/contractors/mappings/${id}`),
};

interface Department {
  department_id: number;
  department_name: string;
}

export const departments = {
  getAll: () => api.get<Department[]>('/admin/departments'),
};

type StaffCreateUpdate = Omit<Staff, 'staff_id' | 'department_name'>;

export const staff = {
  getAll: () => api.get<Staff[]>('/admin/staff'),
  create: (data: StaffCreateUpdate) => api.post<Staff>('/admin/staff', data),
  update: (id: number, data: StaffCreateUpdate) => api.put<Staff>(`/admin/staff/${id}`, data),
  delete: (id: number) => api.delete(`/admin/staff/${id}`),
};

type SalaryCreateUpdate = Omit<Salary, 'salary_id'>;

export const salaries = {
  getAll: () => api.get<Salary[]>('/admin/staff/salaries'),
  create: (data: SalaryCreateUpdate) => api.post<Salary>('/admin/staff/salaries', data),
  update: (id: number, data: SalaryCreateUpdate) => api.put<Salary>(`/admin/staff/salaries/${id}`, data),
  delete: (id: number) => api.delete(`/admin/staff/salaries/${id}`),
  getByStaffId: (staffId: number) => api.get<Salary[]>(`/admin/staff/${staffId}/salaries`),
};

export const vehicles = {
  getAll: () => api.get<Vehicle[]>('/admin/vehicles'),
  create: (data: VehicleCreate) => api.post<Vehicle>('/admin/vehicles', data),
  update: (id: number, data: VehicleCreate) => api.put<Vehicle>(`/admin/vehicles/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/admin/vehicles/${id}`),
  
  getServicing: (vehicleId: number) => api.get<VehicleServicing[]>(`/admin/vehicles/${vehicleId}/servicing`),
  addServicing: (data: VehicleServicingCreate) => api.post<VehicleServicing>('/admin/vehicles/servicing', data),
  updateServicing: (id: number, data: VehicleServicingCreate) => api.put<VehicleServicing>(`/admin/vehicles/servicing/${id}`, data),
  deleteServicing: (id: number) => api.delete<{ message: string }>(`/admin/vehicles/servicing/${id}`),
  
  getInsurance: (vehicleId: number) => api.get<VehicleInsurance[]>(`/admin/vehicles/${vehicleId}/insurance`),
  addInsurance: (data: VehicleInsuranceCreate) => api.post<VehicleInsurance>('/admin/vehicles/insurance', data),
  updateInsurance: (id: number, data: VehicleInsuranceCreate) => api.put<VehicleInsurance>(`/admin/vehicles/insurance/${id}`, data),
  deleteInsurance: (id: number) => api.delete<{ message: string }>(`/admin/vehicles/insurance/${id}`),
};

export const promotions = {
  getAll: () => api.get('/hr/services/promotions'),
  create: (data: any) => api.post('/hr/services/promotions', data),
  update: (id: number, data: any) => api.put(`/hr/services/promotions/${id}`, data),
  delete: (id: number) => api.delete(`/hr/services/promotions/${id}`)
};

export default api; 