import dotenv from 'dotenv';

dotenv.config();

export const NOTION_CONFIG = {
  auth: process.env.NOTION_API_KEY,
  databaseId: process.env.NOTION_DATABASE_ID,
};
