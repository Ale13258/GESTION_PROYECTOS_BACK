import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierEntity } from './domain/supplier.entity';
import { EquipmentEntity } from '../equipment/domain/equipment.entity';
import { SuppliersService } from './application/suppliers.service';
import { SuppliersController } from './suppliers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierEntity, EquipmentEntity])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService, TypeOrmModule],
})
export class SuppliersModule {}
