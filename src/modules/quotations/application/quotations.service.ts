import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationEntity } from '../domain/quotation.entity';
import { CreateQuotationDto, QuotationsQueryDto, UpdateQuotationDto } from '../dto/quotations.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { EquipmentService } from '../../equipment/application/equipment.service';
import { ProjectsService } from '../../projects/application/projects.service';
import { SuppliersService } from '../../suppliers/application/suppliers.service';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(QuotationEntity) private readonly repo: Repository<QuotationEntity>,
    private readonly equipment: EquipmentService,
    private readonly projects: ProjectsService,
    private readonly suppliers: SuppliersService,
  ) {}

  async list(query: QuotationsQueryDto) {
    const qb = this.repo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.supplier', 'supplier')
      .leftJoinAndSelect('q.equipment', 'equipment');
    if (query.projectId) qb.andWhere('q.projectId = :projectId', { projectId: query.projectId });
    if (query.equipmentId) qb.andWhere('q.equipmentId = :equipmentId', { equipmentId: query.equipmentId });
    if (query.status) qb.andWhere('q.status = :status', { status: query.status });
    qb.orderBy('q.date', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return paginated(rows.map((r) => this.toDto(r)), total, query.page, query.pageSize);
  }

  async summary() {
    const all = await this.repo.find();
    const byEquipment = new Map<string, QuotationEntity[]>();
    for (const q of all) {
      const list = byEquipment.get(q.equipmentId) ?? [];
      list.push(q);
      byEquipment.set(q.equipmentId, list);
    }
    let valorFinal = 0;
    let ahorroEstimado = 0;
    for (const [, list] of byEquipment) {
      const amounts = list.map((x) => Number(x.amount));
      const max = Math.max(...amounts);
      const winner = list.find((x) => x.isFinal);
      const finalAmount = winner ? Number(winner.amount) : Math.min(...amounts);
      valorFinal += finalAmount;
      ahorroEstimado += max - finalAmount;
    }
    return {
      quotedEquipment: byEquipment.size,
      quotations: all.length,
      valorFinal,
      ahorroEstimado,
      currency: 'COP',
    };
  }

  async create(dto: CreateQuotationDto) {
    await this.projects.findOrThrow(dto.projectId);
    const eq = await this.equipment.findOrThrow(dto.equipmentId);
    await this.suppliers.findOrThrow(dto.supplierId);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const row = this.repo.create({
      projectId: dto.projectId,
      equipmentId: dto.equipmentId,
      equipmentName: eq.name,
      supplierId: dto.supplierId,
      amount: String(dto.amount),
      deliveryDays: dto.deliveryDays,
      status: dto.status ?? 'Pendiente',
      date: dto.date ?? today,
      isFinal: false,
    });
    return this.toDto(await this.repo.save(row));
  }

  async get(id: string) {
    return this.toDto(await this.findOrThrow(id));
  }

  async update(id: string, dto: UpdateQuotationDto) {
    const q = await this.findOrThrow(id);
    if (dto.amount !== undefined) q.amount = String(dto.amount);
    if (dto.deliveryDays !== undefined) q.deliveryDays = dto.deliveryDays;
    if (dto.status !== undefined) q.status = dto.status;
    return this.toDto(await this.repo.save(q));
  }

  async markFinal(id: string) {
    const q = await this.findOrThrow(id);
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ isFinal: false })
      .where('equipmentId = :equipmentId', { equipmentId: q.equipmentId })
      .execute();
    q.isFinal = true;
    q.status = 'Aprobada';
    return this.toDto(await this.repo.save(q));
  }

  async findOrThrow(id: string) {
    const q = await this.repo.findOne({ where: { id } });
    if (!q) {
      throw new NotFoundException({ code: 'QUOTATION_NOT_FOUND', message: 'Cotización no encontrada', details: [] });
    }
    return q;
  }

  private toDto(q: QuotationEntity) {
    return {
      id: q.id,
      projectId: q.projectId,
      equipmentId: q.equipmentId,
      equipmentName: q.equipmentName,
      supplierId: q.supplierId,
      supplier: q.supplier ? { id: q.supplier.id, name: q.supplier.name } : null,
      amount: Number(q.amount),
      deliveryDays: q.deliveryDays,
      status: q.status,
      date: q.date,
      isFinal: q.isFinal,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    };
  }
}
