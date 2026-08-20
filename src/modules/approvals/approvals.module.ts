import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from './domain/approval.entity';
import { ApprovalsService } from './application/approvals.service';
import { ApprovalsController } from './approvals.controller';
import { EquipmentModule } from '../equipment/equipment.module';
import { EquipmentFileEntity } from '../equipment/domain/equipment-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalEntity, EquipmentFileEntity]), EquipmentModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
