import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/domain/user.entity';

@Entity('user_settings')
export class UserSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  userId: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ default: 'light' })
  theme: string;

  @Column({ default: 'es' })
  language: string;

  @Column({ default: 'COP' })
  currency: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
