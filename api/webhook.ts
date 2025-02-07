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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { body } = req;
    
    if (body?.source?.attempt > 1) {
      return res.status(200).json({ success: true, skipped: 'retry' });
    }

    const properties = body?.data?.properties ?? {};
    const socialUrl = Object.values(properties as Record<string, NotionProperty>)
      .find(prop => prop.type === 'url')?.url ?? null;

    if (!socialUrl) {
      return res.status(200).json({ success: true, skipped: 'no url' });
    }

    const socialInfo = extractSocialInfo(socialUrl);
    if (!socialInfo) {
      return res.status(200).json({ success: true, skipped: 'invalid url' });
    }

    const [profileImageUrl] = await Promise.all([
      socialProfileService.getProfileImage(
        socialInfo.platform,
        socialInfo.username
      )
    ]);

    if (profileImageUrl) {
      await notionService.updateProfileImage(body.data.id, profileImageUrl);
    }

    return res.status(200).json({ 
      success: true,
      updated: !!profileImageUrl 
    });

  } catch (error) {
    // Log error details but don't expose them in response
    console.error('[Webhook Error]:', error);
    
    // Return 200 to acknowledge receipt but indicate error
    return res.status(200).json({ 
      success: false, 
      error: 'Internal processing error' 
    });
  }
}