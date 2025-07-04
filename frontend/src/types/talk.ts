export interface Talk {
  id: number;
  speaker_name: string;
  topic_role: string;
  event_name: string;
  venue: string;
  talk_date: string;
  created_at: string;
  updated_at: string;
}

export interface TalkCreate {
  speaker_name: string;
  topic_role: string;
  event_name: string;
  venue: string;
  talk_date: string;
}

export interface TalkUpdate extends TalkCreate {
  id: number;
} 