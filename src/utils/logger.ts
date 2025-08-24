export class Logger {
  static info(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ℹ️  INFO: ${message}`, data || "");
  }

  static success(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ SUCCESS: ${message}`, data || "");
  }

  static warn(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️  WARN: ${message}`, data || "");
  }

  static error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ERROR: ${message}`, error || "");
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 🐛 DEBUG: ${message}`, data || "");
    }
  }
}
