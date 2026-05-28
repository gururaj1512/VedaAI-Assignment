import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/veda-ai',
  REDIS: {
    URL: process.env.REDIS_URL || '',
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  },
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  UPLOADS_DIR: path.join(__dirname, '../../uploads'),
};

// Check for required environment variables
if (!config.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not set. AI question generation features will fail.');
}
