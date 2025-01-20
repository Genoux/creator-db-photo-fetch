export interface InstagramProfile {
  username: string;
  profileImage: string;
}

export interface NotionProfile {
  id: string;
  instagram_username: string;
  profile_image_url?: string;
}

export interface NotionWebhookPayload {
  source: {
    type: string;
    automation_id: string;
    action_id: string;
    event_id: string;
    attempt: number;
  };
  data: {
    id: string;
    properties: {
      'Main Channel(s)': {
        [key: string]: any;
      };
    };
  };
}
