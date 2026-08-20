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
import { DocumentFolder } from '../../../common/constants';
import { ProjectEntity } from '../../projects/domain/project.entity';

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'varchar' })
  folder: DocumentFolder;

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

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
