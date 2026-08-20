import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/auth.decorators';
import { RedisService } from '../../common/redis/redis.service';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: DataSource,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async health() {
    let database = false;
    try {
      await this.db.query('SELECT 1');
      database = true;
    } catch {
      database = false;
    }
    const redis = await this.redis.ping();
    return {
      status: database ? 'ok' : 'degraded',
      locale: 'es',
      currency: 'COP',
      timezone: process.env.TZ || 'America/Bogota',
      database,
      redis,
      ts: new Date().toISOString(),
    };
  }
}
