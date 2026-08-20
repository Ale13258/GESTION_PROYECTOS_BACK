import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/constants';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: Role;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  mustSetPassword: boolean;

  @Column({ type: 'varchar', nullable: true })
  inviteTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  inviteExpiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
