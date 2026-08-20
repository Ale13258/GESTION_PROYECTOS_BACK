import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './domain/notification.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { IsBoolean, IsOptional } from 'class-validator';

class PatchNotificationDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const data = await this.repo.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return { data, unread: data.filter((n) => !n.read).length };
  }

  @Patch(':id')
  async patch(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchNotificationDto,
  ) {
    const n = await this.repo.findOne({ where: { id, userId: user.id } });
    if (!n) return { ok: false };
    if (dto.read !== undefined) n.read = dto.read;
    return this.repo.save(n);
  }
}
