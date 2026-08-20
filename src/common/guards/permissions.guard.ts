import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/auth.decorators';
import { Permission } from '../constants';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user?.active) {
      throw new ForbiddenException({
        code: 'USER_INACTIVE',
        message: 'Usuario inactivo',
        details: [],
      });
    }
    const ok = required.every((p) => user.permissions.includes(p));
    if (!ok) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'No tiene permisos para esta operación',
        details: required,
      });
    }
    return true;
  }
}
