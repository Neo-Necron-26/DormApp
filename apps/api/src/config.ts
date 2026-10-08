const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOrigin: string | string[] = origins.length > 0 ? origins : "*";
