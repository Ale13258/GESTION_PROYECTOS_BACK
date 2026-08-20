import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalStatus } from '../../../common/constants';
import { EquipmentEntity } from '../../equipment/domain/equipment.entity';
import { ProjectEntity } from '../../projects/domain/project.entity';
import { UserEntity } from '../../users/domain/user.entity';

@Entity('approvals')
export class ApprovalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  equipmentId: string;

  @Column({ type: 'jsonb', default: [] })
  equipmentIds: string[];

  @ManyToOne(() => EquipmentEntity, { eager: true })
  @JoinColumn({ name: 'equipmentId' })
  equipment: EquipmentEntity;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => ProjectEntity, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column('uuid')
  requesterId: string;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'requesterId' })
  requester: UserEntity;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @Column({ type: 'varchar', default: 'En revisión' })
  status: ApprovalStatus;

  @Column({ type: 'int', nullable: true })
  reviewCode: number | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'varchar', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
