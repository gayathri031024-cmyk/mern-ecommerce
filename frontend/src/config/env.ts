interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  isDev: boolean;
  isProd: boolean;
}

const REQUIRED_VARS: Array<keyof ImportMetaEnv> = [
  'VITE_API_BASE_URL',
];

function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

validateEnv();

export const env: AppConfig = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'E-Shop',
  cloudinaryCloudName:
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  cloudinaryUploadPreset:
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};