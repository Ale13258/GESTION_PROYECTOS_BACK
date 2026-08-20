import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationEntity } from './domain/quotation.entity';
import { QuotationsService } from './application/quotations.service';
import { QuotationsController } from './quotations.controller';
import { EquipmentModule } from '../equipment/equipment.module';
import { ProjectsModule } from '../projects/projects.module';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuotationEntity]),
    EquipmentModule,
    ProjectsModule,
    SuppliersModule,
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
