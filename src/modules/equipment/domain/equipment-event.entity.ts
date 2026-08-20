import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EquipmentEntity } from './equipment.entity';

@Entity('equipment_events')
export class EquipmentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  equipmentId: string;

  @ManyToOne(() => EquipmentEntity, (e) => e.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipmentId' })
  equipment: EquipmentEntity;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column()
  event: string;

  @Column({ default: 'info' })
  tone: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
