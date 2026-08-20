import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProjectEntity } from '../../projects/domain/project.entity';

@Entity('comparisons')
export class ComparisonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'jsonb' })
  equipmentIds: string[];

  @Column({ type: 'jsonb' })
  scores: Record<string, number>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
