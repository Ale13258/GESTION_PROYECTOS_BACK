import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../domain/user.entity';
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from '../dto/users.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { ROLE } from '../../../common/constants';
import { MailService } from '../../../common/mail/mail.service';
import { toUserDto } from './user.mapper';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
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

  async findByInviteToken(token: string) {
    const hash = this.hashToken(token);
    if (!hash) return null;
    return this.repo.findOne({ where: { inviteTokenHash: hash } });
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
      passwordHash: await bcrypt.hash(randomBytes(24).toString('hex'), 10),
      role: dto.role ?? ROLE.COLLABORATOR,
      active: true,
      mustSetPassword: true,
    });
    const saved = await this.repo.save(user);
    return this.issueInvite(saved);
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
    user.mustSetPassword = false;
    user.inviteTokenHash = null;
    user.inviteExpiresAt = null;
    await this.repo.save(user);
  }

  async resendInvite(id: string) {
    const user = await this.findByIdOrThrow(id);
    if (!user.mustSetPassword) {
      throw new BadRequestException({
        code: 'PASSWORD_ALREADY_SET',
        message: 'Este usuario ya creó su contraseña',
        details: [],
      });
    }
    return this.issueInvite(user);
  }

  async consumeInvite(token: string, password: string) {
    const user = await this.findByInviteToken(token);
    if (!user) {
      throw new BadRequestException({
        code: 'INVITE_INVALID',
        message: 'El enlace de invitación no es válido',
        details: [],
      });
    }
    if (!user.active) {
      throw new ForbiddenException({ code: 'USER_INACTIVE', message: 'Usuario inactivo', details: [] });
    }
    if (!user.inviteExpiresAt || user.inviteExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException({
        code: 'INVITE_EXPIRED',
        message: 'El enlace de invitación ya venció. Pide uno nuevo al administrador.',
        details: [],
      });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    user.mustSetPassword = false;
    user.inviteTokenHash = null;
    user.inviteExpiresAt = null;
    return this.repo.save(user);
  }

  private async issueInvite(user: UserEntity) {
    const token = randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    if (!hash) {
      throw new BadRequestException({
        code: 'INVITE_INVALID',
        message: 'No se pudo generar la invitación',
        details: [],
      });
    }
    user.inviteTokenHash = hash;
    user.inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    user.mustSetPassword = true;
    await this.repo.save(user);

    const inviteUrl = `${this.appUrl()}/invitar?token=${token}`;
    const queued = this.mail.isConfigured();
    if (queued) {
      this.mail.queueInviteEmail({
        to: user.email,
        name: user.name,
        role: user.role,
        inviteUrl,
        expiresAt: user.inviteExpiresAt,
      });
    } else {
      this.logger.warn(`SMTP no configurado. Enlace de invitación: ${inviteUrl}`);
    }

    return {
      ...toUserDto(user),
      inviteEmailSent: queued,
      inviteUrl: queued ? undefined : inviteUrl,
    };
  }

  private appUrl(): string {
    const value = this.config.get<string>('APP_PUBLIC_URL') || 'https://preubaproyecto.web.app';
    return value.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
  }

  private hashToken(token: string): string | null {
    const value = token?.trim();
    if (!value || value.length < 16) return null;
    return createHash('sha256').update(value).digest('hex');
  }
}
