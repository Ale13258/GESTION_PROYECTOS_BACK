import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSettingsEntity } from './domain/user-settings.entity';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserSettingsEntity])],
  controllers: [SettingsController],
})
export class SettingsModule {}
