import { Client } from '@notionhq/client';
import { NOTION_CONFIG } from '../../config/notion';

export class NotionService {
  private notion: Client;

  constructor() {
    this.notion = new Client({ auth: NOTION_CONFIG.auth });
  }

  async updateProfileImage(pageId: string, imageUrl: string) {
    try {
      await this.notion.pages.update({
        page_id: pageId,
        icon: {
          type: 'external',
          external: {
            url: imageUrl,
          },
        },
        cover: {
          type: 'external',
          external: {
            url: imageUrl,
          },
        },
      });
    } catch (error) {
      console.error('Error updating Notion profile icon:', error);
      throw error;
    }
  }

  async getPage(pageId: string) {
    try {
      return await this.notion.pages.retrieve({
        page_id: pageId,
      });
    } catch (error) {
      console.error('Error retrieving Notion page:', error);
      throw error;
    }
  }
}
