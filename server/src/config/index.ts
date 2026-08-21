import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'civicsense_super_secret_jwt_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'civicsense_super_secret_refresh_jwt_key_2026',
  aiProvider: process.env.AI_PROVIDER || 'mock',
  aiApiKey: process.env.AI_API_KEY || '',
  speechProvider: process.env.SPEECH_PROVIDER || 'mock',
  speechApiKey: process.env.SPEECH_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
