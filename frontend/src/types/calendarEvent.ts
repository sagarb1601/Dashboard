export type EventType = 'event' | 'training' | 'meeting' | 'other';

export type AttendanceStatus = 'attending' | 'not_attending' | 'sending_representative';

export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  venue?: string;
  meeting_link?: string;
  reminder_minutes: number;
  event_type: EventType;
  ed_attendance_status?: AttendanceStatus;
  ed_attendance_remarks?: string;
  ed_attendance_updated_at?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
} 