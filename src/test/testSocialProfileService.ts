// src/test/testSocialProfileService.ts
import { extractSocialInfo } from '../utils/extractSocialInfo';
import { SocialProfileService } from '../services/social/SocialProfileService';

async function testSocialProfileService() {
  const socialProfileService = new SocialProfileService();

  const testCases = [
    // Instagram
    'https://instagram.com/faithwiththejokes',
    'instagram.com/faithwiththejokes',

    // TikTok
    'https://www.tiktok.com/@faithwiththejokes',
    'tiktok.com/@faithwiththejokes',

    // Twitter/X
    'https://twitter.com/elonmusk',
    'https://x.com/elonmusk',

    // YouTube
    'https://youtube.com/@FaithWithTheJokes',
    'https://youtube.com/c/FaithWithTheJokes',

    // Invalid cases
    'https://facebook.com/username',
    'not-a-url',
    '',
    'https://instagram.com/',
    'https://tiktok.com/',
  ];

  console.log('Testing Social Profile Service:\n');

  for (const url of testCases) {
    try {
      console.log('\n=== Testing URL:', url, '===');

      // Test URL parsing
      const socialInfo = extractSocialInfo(url);

      if (!socialInfo) {
        console.log('❌ Invalid or unsupported social media URL\n');
        continue;
      }

      console.log('✅ Successfully extracted info:', socialInfo);

      // Test profile image fetching
      console.log(`🔍 Fetching profile image for ${socialInfo.platform}:${socialInfo.username}...`);
      const imageUrl = await socialProfileService.getProfileImage(
        socialInfo.platform,
        socialInfo.username,
      );

      if (imageUrl) {
        console.log('✅ Successfully retrieved image URL:', imageUrl);
      } else {
        console.log('❌ Failed to retrieve image URL');
      }
    } catch (error) {
      console.error('❌ Error processing URL:', url);
      console.error('Error details:', error, '\n');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSocialProfileService()
    .then(() => console.log('\nTests completed'))
    .catch((error) => console.error('Test execution failed:', error));
}

export { testSocialProfileService };
