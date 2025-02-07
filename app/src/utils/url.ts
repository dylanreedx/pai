const URL = 'https://728e-216-174-81-59.ngrok-free.app';
const env = process.env.NODE_ENV;
export const API_URL =
  env === 'development'
    ? URL
    : (process.env.NEXT_PUBLIC_API_URL as string) ||
      (process.env.API_URL as string);
