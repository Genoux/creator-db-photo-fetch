// src/services/social/channel/TwitterService.ts
import { BaseSocialService, SocialPlatformConfig } from '../BaseSocialService';

export class TwitterService extends BaseSocialService {
  getPlatformConfig(username: string): SocialPlatformConfig {
    return {
      url: `https://x.com/${username}`,
      imageSelector: 'img[alt="Profile avatar"]',
    };
  }
}
