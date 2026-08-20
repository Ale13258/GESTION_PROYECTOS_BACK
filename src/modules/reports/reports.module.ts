import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../projects/domain/project.entity';
import { EquipmentEntity } from '../equipment/domain/equipment.entity';
import { SupplierEntity } from '../suppliers/domain/supplier.entity';
import { QuotationEntity } from '../quotations/domain/quotation.entity';
import { ComparisonEntity } from '../comparisons/domain/comparison.entity';
import { ReportsService } from './application/reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      EquipmentEntity,
      SupplierEntity,
      QuotationEntity,
      ComparisonEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
