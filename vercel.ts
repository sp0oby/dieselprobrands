// Vercel project configuration.
// vercel.ts will replace vercel.json when @vercel/config is GA;
// for now this file documents intent and can be safely ignored by the platform.
export const config = {
  buildCommand: "npm run build",
  framework: "nextjs",
  installCommand: "npm install",
} as const;
