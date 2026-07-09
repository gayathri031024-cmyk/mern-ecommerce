<<<<<<< HEAD
interface AppConfig {
    apiBaseUrl: string;
    appName: string;
    cloudinaryCloudName: string;
    cloudinaryUploadPreset: string;
    isDev: boolean;
    isProd: boolean;
  }
  
  /**
   * Vars that MUST be set for the app to function correctly.
   * Extend this list as new required VITE_ vars are introduced.
   */
  const REQUIRED_VARS: Array<keyof ImportMetaEnv> = ['VITE_API_BASE_URL'];
  
  function validateEnv(): void {
    const missing = REQUIRED_VARS.filter((key) => !import.meta.env[key]);
  
    if (missing.length > 0) {
      // Fail loudly in the browser console rather than silently breaking
      // requests with `undefined` in a URL.
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  validateEnv();
  
  export const env: AppConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    appName: import.meta.env.VITE_APP_NAME || 'E-Shop',
    cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  };
  
=======
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_BASE_URL: string;
  CLIENT_URL: string;
  MONGO_URI: string;
}

const REQUIRED_ENV_VARS = ['MONGO_URI'] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

validateEnv();

export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  PORT: Number(process.env.PORT) || 5000,
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI as string,
};

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
>>>>>>> bfea368bc13d06ff4a5284448bc03d74e9a4d1c9
