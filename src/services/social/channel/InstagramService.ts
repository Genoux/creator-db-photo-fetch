// src/services/social/InstagramService.ts
import { BaseSocialService, SocialPlatformConfig } from '../BaseSocialService';

export class InstagramService extends BaseSocialService {
  getPlatformConfig(username: string): SocialPlatformConfig {
    return {
      url: `https://www.imginn.com/${username}/`,
      imageSelector: '.page-user .userinfo .img img'
    };
  }
}
