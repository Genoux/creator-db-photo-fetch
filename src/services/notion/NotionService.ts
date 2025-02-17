import { Client } from '@notionhq/client';
import { NOTION_CONFIG } from '../../config/notion';
import { put } from '@vercel/blob';

export class NotionService {
  private notion: Client;

  constructor() {
    if (!NOTION_CONFIG.auth) {
      throw new Error('Notion API key is required');
    }
    this.notion = new Client({ auth: NOTION_CONFIG.auth });
  }

  private async getPermamentImageUrl(imageUrl: string, pageId: string): Promise<string> {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const imageBlob = await response.blob();
      
      const { url } = await put(
        `profiles/${pageId}.jpg`,
        imageBlob, 
        { 
          access: 'public',
          addRandomSuffix: false
        }
      );
      console.log('Uploaded to Vercel Blob:', url);
      return url;
    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error);
      throw error;
    }
  }

  async updateProfileImage(pageId: string, imageUrl: string) {
    try {
      const permanentUrl = await this.getPermamentImageUrl(imageUrl, pageId);
      
      await this.notion.pages.update({
        page_id: pageId,
        icon: {
          type: 'external',
          external: { url: permanentUrl },
        },
        cover: {
          type: 'external',
          external: { url: permanentUrl },
        },
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  }
}