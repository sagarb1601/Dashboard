export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  venue?: string;
  meeting_link?: string;
  reminder_minutes: number;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
} 