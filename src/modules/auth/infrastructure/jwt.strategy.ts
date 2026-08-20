import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/application/users.service';
import { permissionsForRole } from '../../../common/constants';

type JwtPayload = { sub: string; email: string; type: 'access' };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', 'access'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findActiveOrThrow(payload.sub);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      title: user.title,
      role: user.role,
      active: user.active,
      permissions: permissionsForRole(user.role),
    };
  }
}
