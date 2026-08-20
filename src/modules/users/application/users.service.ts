import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../domain/user.entity';
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from '../dto/users.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { ROLE } from '../../../common/constants';
import { toUserDto } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase() }, withDeleted: false });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Usuario no encontrado', details: [] });
    return user;
  }

  async findActiveOrThrow(id: string) {
    const user = await this.findByIdOrThrow(id);
    if (!user.active) {
      throw new ForbiddenException({ code: 'USER_INACTIVE', message: 'Usuario inactivo', details: [] });
    }
    return user;
  }

  async list(query: UsersQueryDto) {
    const where: Record<string, unknown>[] = [];
    const base: Record<string, unknown> = {};
    if (query.role) base.role = query.role;
    if (query.active === 'true') base.active = true;
    if (query.active === 'false') base.active = false;
    if (query.q) {
      where.push({ ...base, name: ILike(`%${query.q}%`) });
      where.push({ ...base, email: ILike(`%${query.q}%`) });
    }
    const [rows, total] = await this.repo.findAndCount({
      where: query.q ? where : base,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      order: { createdAt: 'DESC' },
    });
    return paginated(rows.map(toUserDto), total, query.page, query.pageSize);
  }

  async create(dto: CreateUserDto) {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'El email ya está registrado', details: [] });
    const user = this.repo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      title: dto.title ?? null,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: ROLE.COLLABORATOR,
      active: true,
    });
    return toUserDto(await this.repo.save(user));
  }

  async get(id: string) {
    return toUserDto(await this.findByIdOrThrow(id));
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findByIdOrThrow(id);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.title !== undefined) user.title = dto.title;
    if (dto.role !== undefined) user.role = dto.role;
    return toUserDto(await this.repo.save(user));
  }

  async setActive(id: string, active: boolean, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException({
        code: 'CANNOT_DEACTIVATE_SELF',
        message: 'No puede desactivar al usuario de la sesión',
        details: [],
      });
    }
    const user = await this.findByIdOrThrow(id);
    user.active = active;
    return toUserDto(await this.repo.save(user));
  }

  async updatePassword(id: string, password: string) {
    const user = await this.findByIdOrThrow(id);
    user.passwordHash = await bcrypt.hash(password, 10);
    await this.repo.save(user);
  }
}
