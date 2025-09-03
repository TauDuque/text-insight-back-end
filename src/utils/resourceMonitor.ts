// Monitor de recursos para otimização de custos
export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private startTime: number;
  private lastMemoryCheck: number = 0;
  private memoryPeak: number = 0;
  private cpuUsage: number = 0;

  private constructor() {
    this.startTime = Date.now();
  }

  public static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  // Monitorar uso de memória
  public checkMemoryUsage(): void {
    const now = Date.now();

    // Verificar apenas a cada 5 minutos
    if (now - this.lastMemoryCheck < 5 * 60 * 1000) {
      return;
    }

    this.lastMemoryCheck = now;

    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    // Atualizar pico de memória
    if (heapUsedMB > this.memoryPeak) {
      this.memoryPeak = heapUsedMB;
    }

    // Log apenas se uso de memória for alto
    if (heapUsedMB > 200) {
      // Mais de 200MB
      console.warn(
        `⚠️ Alto uso de memória: ${heapUsedMB}MB (Pico: ${this.memoryPeak}MB)`
      );

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
        console.log(
          "🧹 Garbage collection forçado devido ao alto uso de memória"
        );
      }
    }
  }

  // Monitorar tempo de atividade
  public getUptime(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  // Obter estatísticas de recursos
  public getResourceStats(): {
    uptime: number;
    memory: {
      current: number;
      peak: number;
      limit: number;
    };
    cpu: {
      usage: number;
    };
  } {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    return {
      uptime: this.getUptime(),
      memory: {
        current: heapUsedMB,
        peak: this.memoryPeak,
        limit: 1024, // 1GB limite da Railway
      },
      cpu: {
        usage: this.cpuUsage,
      },
    };
  }

  // Verificar se recursos estão dentro dos limites
  public checkResourceLimits(): boolean {
    const stats = this.getResourceStats();

    // Verificar se memória está próxima do limite
    if (stats.memory.current > 800) {
      // Mais de 800MB
      console.error(
        `🚨 CRÍTICO: Uso de memória muito alto: ${stats.memory.current}MB`
      );
      return false;
    }

    // Verificar tempo de atividade (restart se necessário)
    if (stats.uptime > 24 * 60 * 60) {
      // Mais de 24 horas
      console.warn(
        "⚠️ Aplicação rodando há mais de 24 horas - considere restart"
      );
    }

    return true;
  }

  // Iniciar monitoramento
  public startMonitoring(): void {
    console.log("📊 Iniciando monitoramento de recursos...");

    // Verificar recursos a cada 10 minutos
    setInterval(
      () => {
        this.checkMemoryUsage();
        this.checkResourceLimits();
      },
      10 * 60 * 1000
    );

    // Log de estatísticas a cada hora
    setInterval(
      () => {
        const stats = this.getResourceStats();
        console.log(`📊 Estatísticas de recursos:`, {
          uptime: `${Math.round(stats.uptime / 3600)}h`,
          memory: `${stats.memory.current}MB (Pico: ${stats.memory.peak}MB)`,
          cpu: `${stats.cpu.usage}%`,
        });
      },
      60 * 60 * 1000
    );
  }
}

// Exportar instância singleton
export const resourceMonitor = ResourceMonitor.getInstance();
