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
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    if (isDev) {
        const browserOptions = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            executablePath: process.env.CHROME_EXECUTABLE_PATH,
            headless: true,
            ignoreHTTPSErrors: true
        };
        console.log('Launching browser in dev with options:', browserOptions);
        return localPuppeteer.launch(browserOptions);
    } else {
        // Turn off graphics for better performance since we don't need WebGL
        chromium.setGraphicsMode = false;
        
        const browserOptions = {
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: true,
            ignoreHTTPSErrors: true
        };
        console.log('Launching browser in production with options:', browserOptions);
        return puppeteer.launch(browserOptions);
    }
}

  public async getProfileImage(username: string): Promise<string | null> {
    let browser = null;

    try {
      console.log('Starting browser...');
      browser = await this.getBrowser();
      console.log('Browser started successfully');

      const page = await browser.newPage();
      console.log('New page created');

      await page.setRequestInterception(true);
      console.log('Request interception enabled');

      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['font'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      const config = this.getPlatformConfig(username);
      console.log(`Navigating to: ${config.url}`);

      await page.goto(config.url, {
        waitUntil: 'networkidle0',
      });
      console.log('Page loaded');

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

      if (!imageUrl) {
        throw new Error('No image URL found');
      }

      return imageUrl;

    } catch (error) {
      console.error('Error:', error);
      return null;
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('Browser closed');
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  }
}