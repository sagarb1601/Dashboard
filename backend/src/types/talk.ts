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