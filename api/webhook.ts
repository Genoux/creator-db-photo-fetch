import { VercelRequest, VercelResponse } from '@vercel/node';
import { NotionService } from '../src/services/notion/NotionService';
import { SocialProfileService } from '../src/services/social/SocialProfileService';
import { extractSocialInfo } from '../src/utils/extractSocialInfo';

interface NotionProperty {
  id: string;
  type: string;
  url?: string;
}

const notionService = new NotionService();
const socialProfileService = new SocialProfileService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Received webhook');
    const payload = req.body;

    if (payload.source.attempt > 1) {
      console.log('Skipping retry attempt');
      return res.status(200).json({ success: true });
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
      return res.status(200).json({ success: true });
    }

    const socialInfo = extractSocialInfo(socialUrl);
    if (!socialInfo) {
      console.log('No social info extracted');
      return res.status(200).json({ success: true });
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(200).json({ success: true });
  }
}