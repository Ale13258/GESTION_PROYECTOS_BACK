import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './application/auth.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [UsersModule, CommonModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
