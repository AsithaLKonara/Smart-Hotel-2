import IORedis, { RedisOptions } from 'ioredis';

export class Redis {
  private client: IORedis;

  constructor(config?: { url?: string } & RedisOptions) {
    let url = config?.url || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    
    // Prevent Next.js build crash when Railway template variables are unresolved locally
    if (url.includes('${{')) {
      console.warn('[REDIS] Unresolved template variable in REDIS_URL. Falling back to localhost for build.');
      url = 'redis://127.0.0.1:6379';
    }

    // Use maxRetriesPerRequest: 0 to fail fast if Redis is down, preventing unhandled promise rejections
    this.client = new IORedis(url, { maxRetriesPerRequest: 0, ...config });

    // Suppress connection errors from spamming the console
    this.client.on('error', (err: any) => {
      if (err.code === 'ECONNREFUSED') {
        // Silently fail or log once to avoid terminal spam
      } else {
        console.error('[Redis Error]', err.message);
      }
    });
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

  async rpush(key: string, ...values: any[]) {
    const serializedValues = values.map((v) =>
      typeof v === 'string' ? v : JSON.stringify(v)
    );
    return this.client.rpush(key, ...serializedValues);
  }

  async lpop(key: string) {
    return this.client.lpop(key);
  }

  async ping() {
    return this.client.ping();
  }

  async flushdb() {
    return this.client.flushdb();
  }

  // Fallbacks for @upstash/ratelimit
  async evalsha(sha1: string, keys: string[], args: any[]): Promise<any> {
    return this.client.evalsha(sha1, keys.length, ...keys, ...args);
  }
  async eval(script: string, keys: string[], args: any[]): Promise<any> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }
  async scriptLoad(script: string): Promise<string> {
    return (this.client as any).script('LOAD', script);
  }
  async zadd(key: string, ...args: any[]): Promise<number> {
    return (this.client.zadd as any)(key, ...args);
  }
  async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
    return this.client.zremrangebyscore(key, min, max);
  }
  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }
  async zincrby(key: string, increment: number, member: string): Promise<string> {
    return this.client.zincrby(key, increment, member);
  }
  async sadd(key: string, ...members: any[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }
  async hset(key: string, obj: Record<string, any>): Promise<number> {
    return this.client.hset(key, obj);
  }
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }
  pipeline() {
    return this.client.pipeline();
  }
}
