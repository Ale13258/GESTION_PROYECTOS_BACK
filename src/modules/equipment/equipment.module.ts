import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentEntity } from './domain/equipment.entity';
import { EquipmentEventEntity } from './domain/equipment-event.entity';
import { EquipmentFileEntity } from './domain/equipment-file.entity';
import { EquipmentService } from './application/equipment.service';
import { EquipmentController } from './equipment.controller';
import { FilesModule } from '../files/files.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EquipmentEntity, EquipmentEventEntity, EquipmentFileEntity]),
    FilesModule,
    ProjectsModule,
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService, TypeOrmModule],
})
export class EquipmentModule {}
