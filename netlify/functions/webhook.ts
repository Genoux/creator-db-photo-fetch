import { Handler } from '@netlify/functions';
import { NotionService } from '../../src/services/notion/NotionService';
import { SocialProfileService } from '../../src/services/social/SocialProfileService';
import { extractSocialInfo } from '../../src/utils/extractSocialInfo';

interface NotionProperty {
  id: string;
  type: string;
  url?: string;
}

const notionService = new NotionService();
const socialProfileService = new SocialProfileService();

export const handler: Handler = async (event, context) => {
  try {
    console.log('Received webhook');
    
    const payload = JSON.parse(event.body || '{}');

    if (payload.source.attempt > 1) {
      console.log('Skipping retry attempt');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const properties = payload.data.properties;
    let socialUrl: string | null = null;

    for (const prop of Object.values(properties) as NotionProperty[]) {
      if (prop.type === 'url' && prop.url) {
        socialUrl = prop.url;
        break;
      }
    }

    if (!socialUrl) {
      console.log('No social URL found');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const socialInfo = extractSocialInfo(socialUrl);

    if (!socialInfo) {
      console.log('No social info extracted');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    console.log('7. Fetching profile image for:', socialInfo.platform, socialInfo.username);
    const profileImageUrl = await socialProfileService.getProfileImage(
      socialInfo.platform,
      socialInfo.username
    );
    console.log('8. Profile image URL:', profileImageUrl);

    if (profileImageUrl) {
      await notionService.updateProfileImage(payload.data.id, profileImageUrl);
      console.log('Notion updated successfully');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('ERROR:', error);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }
};