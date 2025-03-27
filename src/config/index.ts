import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/codecraft-academy",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,

  // OAuth
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  // Email
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Feature Flags
  features: {
    aiAssistant: process.env.ENABLE_AI_ASSISTANT === "true",
    realTimeCollaboration:
      process.env.ENABLE_REAL_TIME_COLLABORATION === "true",
    gamification: process.env.ENABLE_GAMIFICATION === "true",
  },
};
