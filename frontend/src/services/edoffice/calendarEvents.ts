import api from '../../utils/api';
import { CalendarEvent, AttendanceStatus } from '../../types/calendarEvent';

const API_URL = '/calendar-events';

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const res = await api.get(API_URL);
  return res.data;
};

export const createCalendarEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  const res = await api.post(API_URL, event);
  return res.data;
};

export const updateCalendarEvent = async (id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
  const res = await api.put(`${API_URL}/${id}`, event);
  return res.data;
};

export const updateEventAttendance = async (
  id: number, 
  status: AttendanceStatus, 
  remarks?: string
): Promise<CalendarEvent> => {
  const res = await api.patch(`${API_URL}/${id}/attendance`, { attendance_status: status, remarks });
  return res.data;
};

export const deleteCalendarEvent = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
}; 