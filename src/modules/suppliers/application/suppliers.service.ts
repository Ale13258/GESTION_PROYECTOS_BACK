import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierEntity } from '../domain/supplier.entity';
import { CreateSupplierDto, SuppliersQueryDto, UpdateSupplierDto } from '../dto/suppliers.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { EquipmentEntity } from '../../equipment/domain/equipment.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(SupplierEntity) private readonly repo: Repository<SupplierEntity>,
    @InjectRepository(EquipmentEntity) private readonly equipment: Repository<EquipmentEntity>,
  ) {}

  async list(query: SuppliersQueryDto) {
    const qb = this.repo.createQueryBuilder('s');
    if (query.q) {
      qb.andWhere('(s.name ILIKE :q OR s.email ILIKE :q OR s.contactName ILIKE :q)', { q: `%${query.q}%` });
    }
    if (query.country) qb.andWhere('s.country ILIKE :country', { country: `%${query.country}%` });
    if (query.category) qb.andWhere('s.categories ILIKE :cat', { cat: `%${query.category}%` });
    qb.orderBy('s.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);
    const [rows, total] = await qb.getManyAndCount();
    const data = await Promise.all(rows.map((s) => this.toDto(s, false)));
    return paginated(data, total, query.page, query.pageSize);
  }

  async create(dto: CreateSupplierDto) {
    const supplier = this.repo.create({
      name: dto.name,
      categories: dto.categories,
      contactName: dto.contactName,
      email: dto.email.toLowerCase(),
      phone: dto.phone ?? null,
      country: dto.country ?? 'Colombia',
      rating: dto.rating ?? 0,
    });
    return this.toDto(await this.repo.save(supplier), false);
  }

  async get(id: string) {
    return this.toDto(await this.findOrThrow(id), true);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const supplier = await this.findOrThrow(id);
    Object.assign(supplier, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.categories !== undefined ? { categories: dto.categories } : {}),
      ...(dto.contactName !== undefined ? { contactName: dto.contactName } : {}),
      ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
    });
    return this.toDto(await this.repo.save(supplier), true);
  }

  async findOrThrow(id: string) {
    const supplier = await this.repo.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException({ code: 'SUPPLIER_NOT_FOUND', message: 'Proveedor no encontrado', details: [] });
    }
    return supplier;
  }

  private async toDto(s: SupplierEntity, withCount: boolean) {
    const equipmentCount = withCount
      ? await this.equipment.count({ where: { supplierId: s.id } })
      : undefined;
    return {
      id: s.id,
      name: s.name,
      categories: s.categories,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      country: s.country,
      rating: s.rating,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      ...(withCount ? { equipmentCount } : {}),
    };
  }
}
