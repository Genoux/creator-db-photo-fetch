// src/test/testNotionService.ts
import { NotionService } from '../services/notion/NotionService';

async function testNotionService() {
  const notionService = new NotionService();
  const testPageId = '181a9e8a2ea380f7a335e22af0bac448';
  const imageUrl =
    'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/7327707678447927301~c5_1080x1080.jpeg?lk3s=a5d48078&nonce=38833&refresh_token=12d234864f12c52c237e7e3e8cf95bc0&x-expires=1737583200&x-signature=xjdDQEwgcsSzKByfyHBGniwfR70%3D&shp=a5d48078&shcp=81f88b70';

  try {
    await notionService.updateProfileImage(testPageId, imageUrl);
    console.log('✅ Successfully updated page icon');
  } catch (error) {
    console.error('❌ Error updating icon:', error);
  }
}

if (require.main === module) {
  testNotionService()
    .then(() => console.log('\nTest completed'))
    .catch((error) => console.error('Test failed:', error));
}
