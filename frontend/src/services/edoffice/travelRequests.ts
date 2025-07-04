import { api } from '../api';
import type { TravelRequest } from '../../types/travelRequest';

export const getTravelRequests = async (): Promise<TravelRequest[]> => {
  const response = await api.get('/travel-requests');
  return response.data;
}; 