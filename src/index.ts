import express from 'express';
import type { Request, Response } from 'express';
import { NotionService } from './services/notion/NotionService';
import { SocialProfileService } from './services/social/SocialProfileService';
import { extractSocialInfo } from './utils/extractSocialInfo';

const app = express();
app.use(express.json());

const notionService = new NotionService();
const socialProfileService = new SocialProfileService();

app.post('/webhook', async (req: Request, res: Response): Promise<any> => {
  try {
    const payload = req.body;
    const mainChannels = payload.data.properties['Main Channel(s)'];
    console.log('Main channels:', mainChannels);

    const socialUrl = mainChannels.url || mainChannels[0]?.url;
    if (!socialUrl) {
      return res.status(400).json({ error: 'No social media URL found' });
    }

    const socialInfo = extractSocialInfo(socialUrl);
    console.log('Social info:', socialInfo);

    if (!socialInfo) {
      return res.status(400).json({ error: 'Unsupported platform or invalid URL' });
    }

    const profileImageUrl = await socialProfileService.getProfileImage(
      socialInfo.platform,
      socialInfo.username
    );

    if (!profileImageUrl) {
      return res.status(404).json({ error: 'Profile image not found' });
    }

    await notionService.updateProfileImage(payload.data.id, profileImageUrl);

    return res.json({
      success: true,
      platform: socialInfo.platform,
      username: socialInfo.username,
      imageUrl: profileImageUrl
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});