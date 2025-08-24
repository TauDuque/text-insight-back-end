import Redis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

export const redis = new Redis(redisConfig);

export const connectRedis = async () => {
  try {
    await redis.ping();
    console.log("✅ Redis conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar com Redis:", error);
    throw error;
  }
};

export default redis;
