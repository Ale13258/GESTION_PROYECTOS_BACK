import { UserEntity } from '../domain/user.entity';
import { permissionsForRole } from '../../../common/constants';

export function toUserDto(user: UserEntity) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    title: user.title,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toUserWithPermissions(user: UserEntity) {
  return { ...toUserDto(user), permissions: permissionsForRole(user.role) };
}
