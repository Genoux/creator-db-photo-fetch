// src/services/social/channel/YoutubeService.ts
import { BaseSocialService, SocialPlatformConfig } from '../BaseSocialService';

export class YoutubeService extends BaseSocialService {
  getPlatformConfig(username: string): SocialPlatformConfig {
    return {
      url: `https://youtube.com/${username}`,
      imageSelector: 'img.yt-spec-avatar-shape__image'
    };
  }
}