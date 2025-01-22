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
    try {
      const isDev = process.env.NODE_ENV === 'development';
      const commonArgs = [
        // Basic settings
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',

        // Performance optimizations
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-translate',
        '--disable-device-discovery-notifications',
        '--disable-software-rasterizer',
        '--disable-popup-blocking',
        '--disable-notifications',
        '--disable-canvas-aa',
        '--disable-2d-canvas-clip-aa',
        '--disable-accelerated-2d-canvas',
        '--disable-gl-drawing-for-tests',
        '--disable-composited-antialiasing',
        '--disable-3d-apis',
        '--disable-accelerated-video-decode',
        '--disable-accelerated-video-encode',
        '--disable-ipc-flooding-protection',

        // Memory optimizations
        '--disable-dev-shm-usage',
        '--disable-breakpad',
        '--disable-crash-reporter',

        // Network optimizations
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-features=OptimizationHints',
        '--disable-hang-monitor',
        '--disable-javascript-harmony-shipping',
        '--disable-print-preview',

        // Additional performance settings
        '--ignore-certificate-errors',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--use-gl=swiftshader',
        '--use-angle=swiftshader',
      ];

      if (isDev) {
        console.log('[Browser] Starting in development mode');
        const browserOptions = {
          args: commonArgs,
          executablePath: process.env.CHROME_EXECUTABLE_PATH,
          headless: true,
          ignoreHTTPSErrors: true,
          defaultViewport: {
            width: 1920,
            height: 1080,
          },
        };
        return await localPuppeteer.launch(browserOptions);
      } else {
        console.log('[Browser] Starting in production mode');
        const execPath = (await chromium.executablePath()) || '/usr/bin/chromium-browser';
        if (!execPath) return null;

        const browserOptions = {
          args: [
            ...chromium.args,
            ...commonArgs,
            '--window-size=1920,1080',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ],
          defaultViewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            hasTouch: false,
            isLandscape: true,
            isMobile: false,
          },
          executablePath: execPath,
          headless: chromium.headless as boolean,
          ignoreHTTPSErrors: true,
        };
        return await puppeteer.launch(browserOptions);
      }
    } catch {
      console.log('[Browser] Failed to launch');
      return null;
    }
  }

  public async getProfileImage(username: string): Promise<string | null> {
    let browser = null;
    let page = null;

    try {
      console.log(`[Scraper] Starting process for username: ${username}`);
      const config = this.getPlatformConfig(username);
      browser = await this.getBrowser();
      if (!browser) return null;

      page = await browser.newPage();

      await page.setRequestInterception(true);
      page.on('request', (request) => {
        try {
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
            request.abort().catch(() => request.continue().catch(() => {}));
          } else {
            request.continue().catch(() => request.abort().catch(() => {}));
          }
        } catch {
          request.continue().catch(() => {});
        }
      });

      await page.waitForNetworkIdle().catch(() => null);

      const navigationPromise = page.goto(config.url);

      const imageElement = await page
        .waitForSelector(config.imageSelector, {
          timeout: 10000,
        })
        .catch(() => null);

      if (!imageElement) {
        console.log('[Selector] Image element not found');
        return null;
      }

      const srcHandle = await imageElement.getProperty('src').catch(() => null);
      if (!srcHandle) return null;

      const imageUrl = (await srcHandle.jsonValue().catch(() => null)) as string;
      if (!imageUrl) return null;

      try {
        await navigationPromise;
      } catch {}

      console.log('[Success] Image URL found:', imageUrl.substring(0, 50) + '...');
      return imageUrl;
    } catch {
      console.log('[Error] Failed to get profile image');
      return null;
    } finally {
      try {
        if (page) await page.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
      } catch {}
    }
  }
}
