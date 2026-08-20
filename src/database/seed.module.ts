import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { UserEntity } from '../modules/users/domain/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
