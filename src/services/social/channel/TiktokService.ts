// src/services/social/channel/TiktokService.ts
import { BaseSocialService, SocialPlatformConfig } from '../BaseSocialService';

export class TiktokService extends BaseSocialService {
  getPlatformConfig(username: string): SocialPlatformConfig {
    return {
      url: `https://www.tiktok.com/${username}`,
      imageSelector: 'div[data-e2e="user-avatar"] img'
    };
  }
}
