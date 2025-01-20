import { Client } from '@notionhq/client';
import { NOTION_CONFIG } from '../../config/notion';

export class NotionService {
    private notion: Client;

    constructor() {
        this.notion = new Client({ auth: NOTION_CONFIG.auth });
    }

    async updateProfileImage(profileId: string, imageUrl: string) {
        try {
            await this.notion.pages.update({
                page_id: profileId,
                properties: {
                    profile_image: {
                        url: imageUrl
                    }
                }
            });
        } catch (error) {
            console.error('Error updating Notion profile:', error);
            throw error;
        }
    }
}