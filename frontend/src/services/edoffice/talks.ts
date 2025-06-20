import api from '../../utils/api';
import { Talk, TalkCreate, TalkUpdate } from '../../types/talk';

const API_URL = '/edofc/talks';

export const getTalks = async (): Promise<Talk[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getTalk = async (id: number): Promise<Talk> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createTalk = async (talk: TalkCreate): Promise<Talk> => {
  const response = await api.post(API_URL, talk);
  return response.data;
};

export const updateTalk = async (id: number, talk: TalkUpdate): Promise<Talk> => {
  const response = await api.put(`${API_URL}/${id}`, talk);
  return response.data;
};

export const deleteTalk = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
}; 