// src/services/social/BaseSocialService.ts
import puppeteer from 'puppeteer';

export interface SocialPlatformConfig {
  url: string;
  imageSelector: string;
}

export abstract class BaseSocialService {
  abstract getPlatformConfig(username: string): SocialPlatformConfig;

  public async getProfileImage(username: string): Promise<string | null> {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      const config = this.getPlatformConfig(username);
      
      console.log(`Navigating to profile: ${username}`);
      await page.goto(config.url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const element = await page.waitForSelector(config.imageSelector, {
        visible: true,
        timeout: 5000
      });

      if (!element) {
        console.log('No profile image found for:', username);
        return null;
      }

      const imageUrl = await element.evaluate((el) => el.getAttribute('src'));
      
      if (!imageUrl) {
        console.log('Profile image URL not found for:', username);
        return null;
      }

      return imageUrl;
    } catch (error) {
      console.error('Error in getProfileImage:', error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      await browser.close();
    }
  }
}
