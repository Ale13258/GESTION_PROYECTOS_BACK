import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private readonly options: RedisOptions | string;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL')?.trim();
    this.options = url
      ? url
      : {
          host: config.get('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6379)),
          password: config.get('REDIS_PASSWORD') || undefined,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 4000,
        };
    this.client = this.createClient();
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      /* ignore */
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.ensure();
      return (await this.client.ping()) === 'PONG';
    } catch {
      this.resetClient();
      return false;
    }
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.ensure();
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    await this.ensure();
    return this.client.get(key);
  }

  async del(key: string) {
    await this.ensure();
    await this.client.del(key);
  }

  async delByPattern(pattern: string) {
    await this.ensure();
    const keys = await this.client.keys(pattern);
    if (keys.length) await this.client.del(...keys);
  }

  private createClient(): Redis {
    return typeof this.options === 'string'
      ? new Redis(this.options, { maxRetriesPerRequest: 1, lazyConnect: true, connectTimeout: 4000 })
      : new Redis(this.options);
  }

  private resetClient() {
    try {
      this.client.disconnect();
    } catch {
      /* ignore */
    }
    this.client = this.createClient();
  }

  private async ensure() {
    if (this.client.status === 'end' || this.client.status === 'close') {
      this.resetClient();
    }
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }
}
