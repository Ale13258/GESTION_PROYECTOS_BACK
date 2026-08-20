import { Permission, Role } from '../constants';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  title: string | null;
  role: Role;
  active: boolean;
  permissions: Permission[];
};
