export interface Staff {
  staff_id: number;
  name: string;
  department_id: number;
  department_name: string;
  joining_date: string;
  date_of_leaving: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  salary_entries?: Array<{
    salary_id: number;
    payment_date: string;
    net_salary: number;
    status: 'PAID' | 'PENDING';
  }>;
}

export interface Salary {
  salary_id: number;
  staff_id: number;
  net_salary: number;
  payment_date: string;
  status: 'PAID' | 'PENDING';
}

export interface StaffWithSalary extends Staff {
  salaries?: Salary[];
} 