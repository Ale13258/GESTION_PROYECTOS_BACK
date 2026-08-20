import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileCategory } from '../../../common/constants';
import { EquipmentEntity } from './equipment.entity';

@Entity('equipment_files')
export class EquipmentFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  equipmentId: string;

  @ManyToOne(() => EquipmentEntity, (e) => e.files)
  @JoinColumn({ name: 'equipmentId' })
  equipment: EquipmentEntity;

  @Column({ type: 'varchar' })
  category: FileCategory;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  storageKey: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
