import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import * as localPuppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

export interface SocialPlatformConfig {
  url: string;
  imageSelector: string;
}

function delay(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

export abstract class BaseSocialService {
  abstract getPlatformConfig(username: string): SocialPlatformConfig;

  private async getBrowser() {
    const isDev = process.env.NODE_ENV === 'development';
    const commonArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials'
    ];

    if (isDev) {
      const browserOptions = {
        args: commonArgs,
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        headless: true,
        ignoreHTTPSErrors: true
      };
      return localPuppeteer.launch(browserOptions);
    } else {
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
          '--window-size=1920,1080',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

     const config = this.getPlatformConfig(username);

      browser = await this.getBrowser();
      page = await browser.newPage();
  
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();
        
        if (
          url.includes('google-analytics.com') ||
          url.includes('doubleclick.net') ||
          url.includes('facebook.com') ||
          url.includes('google.com') ||
          url.includes('amazon-adsystem.com') ||
          url.includes('adnxs.com') ||
          url.includes('googleapis.com') ||
          resourceType === 'font' ||
          resourceType === 'media' ||
          resourceType === 'websocket' ||
          resourceType === 'manifest' ||
          resourceType === 'other'
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.waitForNetworkIdle();
  
      const navigationPromise = page.goto(config.url);

      await delay(Math.random() * 1000 + 1000);

      const imageElement = await page.waitForSelector(config.imageSelector, {
        timeout: 10000
      });
  
      if (!imageElement) {
        throw new Error('Profile image not found');
      }
  
      const srcHandle = await imageElement.getProperty('src');
      const imageUrl = (await srcHandle.jsonValue()) as string;
  
      try {
        await navigationPromise;
      } catch (e) {
      }
  
      return imageUrl;
  
    } catch (error) {
      console.error('Error:', error);
      return null;
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}