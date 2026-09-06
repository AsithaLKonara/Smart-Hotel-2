import IORedis, { RedisOptions } from 'ioredis';

export class Redis {
  private client: IORedis;

  constructor(config?: { url?: string } & RedisOptions) {
    const url = config?.url || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.client = new IORedis(url, config);
  }

  static fromEnv() {
    return new Redis();
  }

  // Matches @upstash/redis get<T>
  async get<T = any>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as any as T;
    }
  }

  // Matches @upstash/redis set
  async set(
    key: string,
    value: any,
    options?: { ex?: number; px?: number; nx?: boolean; xx?: boolean }
  ): Promise<any> {
    const val = typeof value === 'string' ? value : JSON.stringify(value);

    if (options) {
      const args: any[] = [];
      if (options.ex) args.push('EX', options.ex);
      else if (options.px) args.push('PX', options.px);
      if (options.nx) args.push('NX');
      else if (options.xx) args.push('XX');

      if (args.length > 0) {
        return (this.client.set as any)(key, val, ...args);
      }
    }
    return this.client.set(key, val);
  }

  async del(...keys: string[]) {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async publish(channel: string, message: any) {
    const val = typeof message === 'string' ? message : JSON.stringify(message);
    return this.client.publish(channel, val);
  }

  async incr(key: string) {
    return this.client.incr(key);
  }
  
  async expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }

  async lpush(key: string, ...values: any[]) {
    const serializedValues = values.map((v) =>
      typeof v === 'string' ? v : JSON.stringify(v)
    );
    return this.client.lpush(key, ...serializedValues);
  }

  async ping() {
    return this.client.ping();
  }

  async flushdb() {
    return this.client.flushdb();
  }
}
