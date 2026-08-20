import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuotationStatus } from '../../../common/constants';
import { EquipmentEntity } from '../../equipment/domain/equipment.entity';
import { ProjectEntity } from '../../projects/domain/project.entity';
import { SupplierEntity } from '../../suppliers/domain/supplier.entity';

@Entity('quotations')
export class QuotationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column('uuid')
  equipmentId: string;

  @ManyToOne(() => EquipmentEntity, { eager: true })
  @JoinColumn({ name: 'equipmentId' })
  equipment: EquipmentEntity;

  @Column()
  equipmentName: string;

  @Column('uuid')
  supplierId: string;

  @ManyToOne(() => SupplierEntity, { eager: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: SupplierEntity;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: string;

  @Column({ type: 'int' })
  deliveryDays: number;

  @Column({ type: 'varchar', default: 'Pendiente' })
  status: QuotationStatus;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: false })
  isFinal: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
