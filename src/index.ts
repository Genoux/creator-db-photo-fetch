import express from 'express';
import dotenv from 'dotenv';
import { NotionService } from './services/notion/NotionService';
import { SocialProfileService } from './services/social/SocialProfileService';
import { extractSocialInfo } from './utils/extractSocialInfo';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

app.post('/api/webhook', async (req, res) => {
  try {
    const { body } = req;
    if (!body?.data) {
      throw new ValidationError('Missing request data');
    }

    if (body.source?.attempt > 1) {
      res.status(200).json({
        success: true,
        skipped: 'retry'
      });
      return;
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

    if (!socialInfo.platform || !socialInfo.username) {
      throw new ValidationError('Missing platform or username in social URL');
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
    
    res.status(200).json({
      success: true,
      updated: true
    });

  } catch (error) {
    console.error('[Webhook Error]:', error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal processing error'
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});