import { Handler } from '@netlify/functions';
import { NotionService } from '../../src/services/notion/NotionService';
import { SocialProfileService } from '../../src/services/social/SocialProfileService';
import { extractSocialInfo } from '../../src/utils/extractSocialInfo';

const notionService = new NotionService();
const socialProfileService = new SocialProfileService();

export const handler: Handler = async (event, context) => {
  try {
    const payload = JSON.parse(event.body || '{}');
    
    if (payload.source.attempt > 1) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const mainChannels = payload.data.properties['Main Channel(s)'];
    const socialUrl = mainChannels.url || mainChannels[0]?.url;
    
    if (!socialUrl) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const socialInfo = extractSocialInfo(socialUrl);
    
    if (!socialInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const profileImageUrl = await socialProfileService.getProfileImage(
      socialInfo.platform,
      socialInfo.username
    );

    if (profileImageUrl) {
      await notionService.updateProfileImage(payload.data.id, profileImageUrl);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }
};