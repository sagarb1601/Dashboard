import axios from 'axios';
import { CalendarEvent } from '../../types/calendarEvent';

const API_URL = 'http://localhost:5000/api/calendar-events';

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createCalendarEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  const res = await axios.post(API_URL, event);
  return res.data;
};

export const updateCalendarEvent = async (id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
  const res = await axios.put(`${API_URL}/${id}`, event);
  return res.data;
};

export const deleteCalendarEvent = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
}; 