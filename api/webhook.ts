import { VercelRequest, VercelResponse } from '@vercel/node';
import { NotionService } from '../src/services/notion/NotionService';
import { SocialProfileService } from '../src/services/social/SocialProfileService';
import { extractSocialInfo } from '../src/utils/extractSocialInfo';

interface NotionProperty {
  id: string;
  type: string;
  url?: string;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const notionService = new NotionService();
const socialProfileService = new SocialProfileService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { body } = req;
    
    if (!body?.data) {
      throw new ValidationError('Missing request data');
    }

    // Retry handling - always return 200 for retries
    if (body.source?.attempt > 1) {
      return res.status(200).json({ 
        success: true, 
        skipped: 'retry' 
      });
    }

    const properties = body.data.properties ?? {};
    if (!Object.keys(properties).length) {
      throw new ValidationError('Missing properties data');
    }

    const socialUrl = Object.values(properties as Record<string, NotionProperty>)
      .find(prop => prop.type === 'url')?.url ?? null;

    if (!socialUrl) {
      throw new ValidationError('Missing social URL');
    }

    const socialInfo = extractSocialInfo(socialUrl);
    if (!socialInfo) {
      throw new ValidationError('Invalid social media URL format');
    }

    const [profileImageUrl] = await Promise.all([
      socialProfileService.getProfileImage(
        socialInfo.platform,
        socialInfo.username
      )
    ]);

    if (!profileImageUrl) {
      throw new ValidationError('Could not retrieve profile image');
    }

    await notionService.updateProfileImage(body.data.id, profileImageUrl);

    return res.status(200).json({
      success: true,
      updated: true
    });

  } catch (error) {
    console.error('[Webhook Error]:', error);
    
    return res.status(200).json({
      success: false,
      error: error instanceof ValidationError 
        ? error.message 
        : 'Internal processing error'
    });
  }
}