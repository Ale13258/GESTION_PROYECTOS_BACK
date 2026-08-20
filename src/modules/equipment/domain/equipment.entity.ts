import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EquipmentStatus } from '../../../common/constants';
import { ProjectEntity } from '../../projects/domain/project.entity';
import { SupplierEntity } from '../../suppliers/domain/supplier.entity';
import { EquipmentSpecs } from './equipment-specs';
import { EquipmentEventEntity } from './equipment-event.entity';
import { EquipmentFileEntity } from './equipment-file.entity';

@Entity('equipment')
export class EquipmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'uuid', nullable: true })
  supplierId: string | null;

  @ManyToOne(() => SupplierEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: SupplierEntity | null;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  model: string | null;

  @Column()
  proceso: string;

  @Column({ type: 'varchar', default: 'Registrado' })
  status: EquipmentStatus;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  precio: string | null;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @Column({ type: 'jsonb' })
  specs: EquipmentSpecs;

  @OneToMany(() => EquipmentEventEntity, (e) => e.equipment, { cascade: true })
  events: EquipmentEventEntity[];

  @OneToMany(() => EquipmentFileEntity, (f) => f.equipment)
  files: EquipmentFileEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
