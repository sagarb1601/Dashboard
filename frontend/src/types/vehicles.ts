export interface Vehicle {
  vehicle_id: number;
  company_name: string;
  model: string;
  registration_no: string;
  created_at: string;
}

export interface VehicleCreate {
  company_name: string;
  model: string;
  registration_no: string;
}

export interface VehicleServicing {
  service_id: number;
  vehicle_id: number;
  service_date: string;
  next_service_date: string;
  service_description: string;
  servicing_amount: number;
  created_at: string;
}

export interface VehicleServicingCreate {
  vehicle_id: number;
  service_date: string;
  next_service_date: string;
  service_description: string;
  servicing_amount: number;
}

export interface VehicleInsurance {
  insurance_id: number;
  vehicle_id: number;
  insurance_provider: string;
  policy_number: string;
  insurance_start_date: string;
  insurance_end_date: string;
  created_at: string;
}

export interface VehicleInsuranceCreate {
  vehicle_id: number;
  insurance_provider: string;
  policy_number: string;
  insurance_start_date: string;
  insurance_end_date: string;
} 