import Redis from "ioredis";

let redis: Redis;

if (process.env.NODE_ENV === "development") {
  // Em desenvolvimento, usa Redis local
  const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };

  redis = new Redis(redisConfig);
} else {
  // Em produção, usa Redis externo via REDIS_URL
  redis = new Redis(process.env.REDIS_URL!);
}

export { redis };

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
