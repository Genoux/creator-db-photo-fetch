// config/notion.ts
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
  throw new Error('Missing required Notion environment variables');
}

export const NOTION_CONFIG = {
  auth: process.env.NOTION_API_KEY,
  databaseId: process.env.NOTION_DATABASE_ID,
} as const;