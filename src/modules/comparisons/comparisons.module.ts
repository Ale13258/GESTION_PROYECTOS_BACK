import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparisonEntity } from './domain/comparison.entity';
import { EquipmentEntity } from '../equipment/domain/equipment.entity';
import { ComparisonsService } from './application/comparisons.service';
import { ComparisonsController } from './comparisons.controller';
import { EquipmentModule } from '../equipment/equipment.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComparisonEntity, EquipmentEntity]),
    EquipmentModule,
    ProjectsModule,
  ],
  controllers: [ComparisonsController],
  providers: [ComparisonsService],
  exports: [ComparisonsService],
})
export class ComparisonsModule {}
