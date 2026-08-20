import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettingsEntity } from './domain/user-settings.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { IsIn, IsOptional, IsString } from 'class-validator';

class PatchSettingsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  language?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

@ApiTags('settings')
@ApiBearerAuth()
@RequirePermissions('manageSettings')
@Controller('settings')
export class SettingsController {
  constructor(
    @InjectRepository(UserSettingsEntity)
    private readonly repo: Repository<UserSettingsEntity>,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthUser) {
    return this.ensure(user.id);
  }

  @Patch()
  async patch(@CurrentUser() user: AuthUser, @Body() dto: PatchSettingsDto) {
    const row = await this.ensure(user.id);
    if (dto.theme) row.theme = dto.theme;
    if (dto.language) row.language = dto.language;
    if (dto.currency) row.currency = dto.currency;
    return this.repo.save(row);
  }

  private async ensure(userId: string) {
    let row = await this.repo.findOne({ where: { userId } });
    if (!row) {
      row = await this.repo.save(
        this.repo.create({ userId, theme: 'light', language: 'es', currency: 'COP' }),
      );
    }
    return row;
  }
}
