import * as yup from 'yup';

export interface Contractor {
  contractor_id: number;
  contractor_company_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export interface Department {
  department_id: number;
  department_name: string;
  created_at?: string;
}

export interface ContractorMapping {
  contract_id: number;
  contractor_id: number;
  department_id: number;
  start_date: string;
  end_date: string;
  contractor_company_name: string;
  department_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UPCOMING';
  days_remaining: number;
  alert_level: 'CRITICAL' | 'WARNING' | 'INFO' | 'NONE';
  created_at?: string;
}

export const contractorSchema = yup.object().shape({
  contractor_company_name: yup
    .string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters')
    .matches(/^[a-zA-Z0-9\s&-_.]+$/, 'Company name contains invalid characters'),
  
  contact_person: yup
    .string()
    .required('Contact person is required')
    .min(2, 'Contact person must be at least 2 characters')
    .max(100, 'Contact person must not exceed 100 characters')
    .matches(/^[a-zA-Z\s.]+$/, 'Contact person must contain only letters'),
  
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      'Please enter a valid phone number'
    ),
  
  email: yup
    .string()
    .email('Please enter a valid email')
    .optional()
    .nullable(),
  
  address: yup
    .string()
    .optional()
    .max(500, 'Address must not exceed 500 characters')
    .nullable(),
});

export const mappingSchema = yup.object().shape({
  contractor_id: yup.number().required('Please select a contractor'),
  department_id: yup.number().required('Please select a department'),
  start_date: yup.string().required('Start date is required'),
  end_date: yup.string().required('End date is required'),
}); 