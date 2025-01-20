import { Handler } from '@netlify/functions';
import { NotionService } from '../../src/services/notion/NotionService';
import { SocialProfileService } from '../../src/services/social/SocialProfileService';
import { extractSocialInfo } from '../../src/utils/extractSocialInfo';

const notionService = new NotionService();
const socialProfileService = new SocialProfileService();

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const mainChannels = payload.data.properties['Main Channel(s)'];
        console.log('Main channels:', mainChannels);

        const socialUrl = mainChannels.url || mainChannels[0]?.url;
        if (!socialUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No social media URL found' })
            };
        }

        const socialInfo = extractSocialInfo(socialUrl);
        console.log('Social info:', socialInfo);

        if (!socialInfo) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Unsupported platform or invalid URL' })
            };
        }

        const profileImageUrl = await socialProfileService.getProfileImage(
            socialInfo.platform,
            socialInfo.username
        );

        if (!profileImageUrl) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Profile image not found' })
            };
        }

        //await notionService.updateProfileImage(payload.data.id, profileImageUrl)
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                platform: socialInfo.platform,
                username: socialInfo.username,
                imageUrl: profileImageUrl
            })
        };

    } catch (error) {
        console.error('Error processing webhook:', error);
        // Make sure we return a properly formatted error message
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined
            })
        };
    }
};