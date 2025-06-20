export type TravelRequestStatus = 'approved' | 'pending' | 'rejected';

export interface TravelRequest {
  id: number;
  employee_name: string;
  purpose: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: TravelRequestStatus;
  remarks?: string;
  created_at: string;
  updated_at: string;
} 