import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import * as localPuppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

export interface SocialPlatformConfig {
  url: string;
  imageSelector: string;
}

export abstract class BaseSocialService {
  abstract getPlatformConfig(username: string): SocialPlatformConfig;

  private async getBrowser() {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      const browserOptions = {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        headless: false,
        ignoreHTTPSErrors: true
      };
      return localPuppeteer.launch(browserOptions);
    } else {
      // Initialize chromium
      const execPath = await chromium.executablePath() || '/usr/bin/chromium-browser';
      if (!execPath) {
        throw new Error('Chromium executable path is undefined');
      }

      const browserOptions = {
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: execPath,
        headless: chromium.headless as boolean,
        ignoreHTTPSErrors: true,
      };

      return await puppeteer.launch(browserOptions);
    }
  }

  public async getProfileImage(username: string): Promise<string | null> {
    let browser = null;
    let page = null;

    try {
      browser = await this.getBrowser();

      page = await browser.newPage();

      await page.setRequestInterception(true);

      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['font', 'stylesheet', 'script'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      const config = this.getPlatformConfig(username);

      await page.goto(config.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const element = await page.waitForSelector(config.imageSelector, {
        visible: true,
        timeout: 15000,
      });
      console.log('Found selector');

      if (!element) {
        throw new Error('No profile image element found');
      }

      const srcHandle = await element.getProperty('src');
      const imageUrl = (await srcHandle.jsonValue()) as string;

      console.log('Image URL:', imageUrl);

      if (!imageUrl) {
        throw new Error('No image URL found');
      }

      return imageUrl;
    } catch (error) {
      console.error('Error:', error);
      return null;
    } finally {
      try {
        if (page) await page.close();
        if (browser) await browser.close();
        console.log('Browser and page closed');
      } catch (closeError) {
        console.error('Error during cleanup:', closeError);
      }
    }
  }
}