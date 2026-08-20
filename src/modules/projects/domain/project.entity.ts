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
import { ProjectStatus } from '../../../common/constants';
import { UserEntity } from '../../users/domain/user.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  client: string;

  @Column()
  location: string;

  @Column('uuid')
  engineerId: string;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'engineerId' })
  engineer: UserEntity;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', default: 'Activo' })
  status: ProjectStatus;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'date' })
  startDate: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
