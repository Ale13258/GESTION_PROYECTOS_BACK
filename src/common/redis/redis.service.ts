import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: Number(config.get('REDIS_PORT', 6379)),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.connect();
      return (await this.client.ping()) === 'PONG';
    } catch {
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

  private async ensure() {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect();
    }
  }
}
