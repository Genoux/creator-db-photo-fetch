// src/services/social/SocialProfileService.ts
import { InstagramService } from './channel/InstagramService';
import { TiktokService } from './channel/TiktokService';
import { TwitterService } from './channel/TwitterService';
import { YoutubeService } from './channel/YoutubeService';
import { BaseSocialService } from './BaseSocialService';

export class SocialProfileService {
  private services: { [key: string]: BaseSocialService };

  constructor() {
    this.services = {
      instagram: new InstagramService(),
      tiktok: new TiktokService(),
      twitter: new TwitterService(),
      youtube: new YoutubeService(),
    };
  }

  async getProfileImage(platform: string, username: string): Promise<string | null> {
    const service = this.services[platform];
    if (!service) {
      console.log(`Unsupported platform: ${platform}`);
      return null;
    }
    return service.getProfileImage(username);
  }
}
