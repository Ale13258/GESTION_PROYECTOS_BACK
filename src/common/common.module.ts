import { Module } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { MailService } from './mail/mail.service';

@Module({
  providers: [RedisService, MailService],
  exports: [RedisService, MailService],
})
export class CommonModule {}
