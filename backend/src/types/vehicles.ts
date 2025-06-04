export interface Vehicle {
    vehicle_id: number;
    company_name: string;
    model: string;
    registration_no: string;
    created_at: Date;
}

export interface VehicleCreate {
    company_name: string;
    model: string;
    registration_no: string;
}

export interface VehicleServicing {
    service_id: number;
    vehicle_id: number;
    service_date: Date;
    next_service_date: Date;
    service_description: string;
    servicing_amount: number;
    created_at: Date;
}

export interface VehicleServicingCreate {
    vehicle_id: number;
    service_date: Date;
    next_service_date: Date;
    service_description: string;
    servicing_amount: number;
}

export interface VehicleInsurance {
    insurance_id: number;
    vehicle_id: number;
    insurance_provider: string;
    policy_number: string;
    insurance_start_date: Date;
    insurance_end_date: Date;
    created_at: Date;
}

export interface VehicleInsuranceCreate {
    vehicle_id: number;
    insurance_provider: string;
    policy_number: string;
    insurance_start_date: Date;
    insurance_end_date: Date;
} 