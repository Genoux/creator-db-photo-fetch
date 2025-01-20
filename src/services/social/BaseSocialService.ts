import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import * as localPuppeteer from 'puppeteer';

export interface SocialPlatformConfig {
  url: string;
  imageSelector: string;
}

export abstract class BaseSocialService {
  abstract getPlatformConfig(username: string): SocialPlatformConfig;

  private async getBrowser() {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      return localPuppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  public async getProfileImage(username: string): Promise<string | null> {
    let browser = null;
    try {
      browser = await this.getBrowser();
      const page = await browser.newPage();
      const config = this.getPlatformConfig(username);

      console.log(`Navigating to profile: ${username}`);
      await page.goto(config.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const element = await page.waitForSelector(config.imageSelector, {
        visible: true,
        timeout: 5000,
      });

      if (!element) {
        console.log('No profile image found for:', username);
        return null;
      }

      const srcHandle = await element.getProperty('src');
      const imageUrl = (await srcHandle.jsonValue()) as string;

      if (!imageUrl) {
        console.log('Profile image URL not found for:', username);
        return null;
      }

      return imageUrl;
    } catch (error) {
      console.error('Error in getProfileImage:', error);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }
}
