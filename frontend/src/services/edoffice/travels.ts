import { api } from '../api';
import { Travel, CreateTravelPayload, UpdateTravelPayload, UpdateTravelStatusPayload } from '../../types/travel';

const API_URL = '/ed/travels';

export const getTravels = async (): Promise<Travel[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getTravel = async (id: number): Promise<Travel> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createTravel = async (travel: CreateTravelPayload): Promise<Travel> => {
  const response = await api.post(API_URL, travel);
  return response.data;
};

export const updateTravel = async (id: number, travel: UpdateTravelPayload): Promise<Travel> => {
  const response = await api.put(`${API_URL}/${id}`, travel);
  return response.data;
};

export const updateTravelStatus = async (id: number, statusData: UpdateTravelStatusPayload): Promise<Travel> => {
  const response = await api.patch(`${API_URL}/${id}/status`, statusData);
  return response.data;
};

export const deleteTravel = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
}; 