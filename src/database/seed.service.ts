import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../modules/users/domain/user.entity';
import { ROLE } from '../common/constants';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.users.count({ withDeleted: true });
    if (count > 0) return;
    await this.run();
  }

  async run() {
    const adminEmail = this.config.get('SEED_ADMIN_EMAIL', 'admin@promanage.local');
    const adminPass = this.config.get('SEED_ADMIN_PASSWORD', 'Admin123');

    await this.users.save(
      this.users.create({
        name: 'Administrador ProManage',
        email: adminEmail.toLowerCase(),
        title: 'Director de ingeniería',
        passwordHash: await bcrypt.hash(adminPass, 10),
        role: ROLE.ADMIN,
        active: true,
      }),
    );

    this.logger.log(`Usuario inicial: ${adminEmail} / ${adminPass}`);
  }
}
