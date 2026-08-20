import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/application/users.service';
import { RedisService } from '../../../common/redis/redis.service';
import { permissionsForRole } from '../../../common/constants';
import { UserEntity } from '../../users/domain/user.entity';
import { toUserDto } from '../../users/application/user.mapper';

function parseTtl(value: string, fallback: number): number {
  const m = /^(\d+)([smhd])$/.exec(value);
  if (!m) return fallback;
  const n = Number(m[1]);
  const unit = m[2];
  const map: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * map[unit];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas', details: [] });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas', details: [] });
    if (!user.active) {
      throw new ForbiddenException({ code: 'USER_INACTIVE', message: 'Usuario inactivo', details: [] });
    }
    return this.issue(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; jti: string; type: string }>(
        refreshToken,
        { secret: this.config.get('JWT_REFRESH_SECRET', 'refresh') },
      );
      if (payload.type !== 'refresh') throw new Error('bad type');
      const stored = await this.redis.get(`refresh:${payload.sub}:${payload.jti}`);
      if (!stored) throw new Error('revoked');
      const user = await this.users.findActiveOrThrow(payload.sub);
      await this.redis.del(`refresh:${payload.sub}:${payload.jti}`);
      return this.issue(user);
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH', message: 'Refresh token inválido', details: [] });
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string; jti: string }>(refreshToken, {
          secret: this.config.get('JWT_REFRESH_SECRET', 'refresh'),
        });
        await this.redis.del(`refresh:${payload.sub}:${payload.jti}`);
      } catch {
        /* ignore */
      }
    } else {
      await this.redis.delByPattern(`refresh:${userId}:*`);
    }
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.users.findActiveOrThrow(userId);
    return { ...toUserDto(user), permissions: permissionsForRole(user.role) };
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.users.findByIdOrThrow(userId);
    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'Contraseña actual incorrecta',
        details: [],
      });
    }
    await this.users.updatePassword(userId, next);
    await this.redis.delByPattern(`refresh:${userId}:*`);
    return { ok: true };
  }

  private async issue(user: UserEntity) {
    const jti = uuid();
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, type: 'access' },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', 'access'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti, type: 'refresh' },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES', '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
    const ttl = parseTtl(this.config.get('JWT_REFRESH_EXPIRES', '7d'), 7 * 86400);
    try {
      await this.redis.set(`refresh:${user.id}:${jti}`, '1', ttl);
    } catch {
      /* Redis caído: el access token igual sirve; el refresh no se podrá revocar. */
    }
    return {
      accessToken,
      refreshToken,
      user: { ...toUserDto(user), permissions: permissionsForRole(user.role) },
    };
  }
}
