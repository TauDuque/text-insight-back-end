import redis from "../config/redis";

export class CacheService {
  private defaultTTL = 300; // 5 minutos

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Erro ao buscar cache:", error);
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Erro ao deletar cache:", error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Erro ao verificar cache:", error);
      return false;
    }
  }

  // Cache específico para análises
  async cacheAnalysis(
    analysisId: string,
    data: any,
    ttl: number = 3600
  ): Promise<void> {
    await this.set(`analysis:${analysisId}`, data, ttl);
  }

  async getCachedAnalysis(analysisId: string): Promise<any> {
    return await this.get(`analysis:${analysisId}`);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `user:${userId}:*`;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Erro ao invalidar cache do usuário:", error);
    }
  }

  // Cache para estatísticas da fila
  async cacheQueueStats(stats: any, ttl: number = 30): Promise<void> {
    await this.set("queue:stats", stats, ttl);
  }

  async getCachedQueueStats(): Promise<any> {
    return await this.get("queue:stats");
  }
}

export const cacheService = new CacheService();
