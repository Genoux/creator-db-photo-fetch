import { VercelRequest, VercelResponse } from '@vercel/node';
import pkg from '../package.json';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    app: 'inBeat - Notion Creatordb Profile Image Fetcher',
    description: pkg.description,
    version: pkg.version,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}