import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './domain/project.entity';
import { ProjectsService } from './application/projects.service';
import { ProjectsController } from './projects.controller';
import { DocumentEntity } from '../documents/domain/document.entity';
import { EquipmentEntity } from '../equipment/domain/equipment.entity';
import { QuotationEntity } from '../quotations/domain/quotation.entity';
import { ComparisonEntity } from '../comparisons/domain/comparison.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      ProjectEntity,
      DocumentEntity,
      EquipmentEntity,
      QuotationEntity,
      ComparisonEntity,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, TypeOrmModule],
})
export class ProjectsModule {}
