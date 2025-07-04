export type TravelType = 'foreign' | 'domestic';
export type TravelStatus = 'going' | 'not_going' | 'deputing';

export interface Travel {
  id: number;
  travel_type: TravelType;
  location: string;
  onward_date: string;
  return_date: string;
  purpose: string;
  accommodation: string;
  remarks: string;
  status: TravelStatus;
  deputing_remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTravelPayload {
  travel_type: TravelType;
  location: string;
  onward_date: string;
  return_date: string;
  purpose: string;
  accommodation: string;
  remarks: string;
}

export interface UpdateTravelPayload extends CreateTravelPayload {}

export interface UpdateTravelStatusPayload {
  status: TravelStatus;
  deputing_remarks?: string;
} 