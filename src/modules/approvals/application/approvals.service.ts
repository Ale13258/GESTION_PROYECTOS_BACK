import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalEntity } from '../domain/approval.entity';
import { CreateApprovalDto, ApprovalsQueryDto, ReviewApprovalDto, UpdateApprovalDto } from '../dto/approvals.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { ApprovalStatus } from '../../../common/constants';
import { EquipmentService } from '../../equipment/application/equipment.service';
import { EquipmentFileEntity } from '../../equipment/domain/equipment-file.entity';

function mapReview(code: number): ApprovalStatus {
  if (code === 1 || code === 2) return 'Aprobada';
  if (code === 4) return 'Rechazada';
  return 'En revisión';
}

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(ApprovalEntity) private readonly repo: Repository<ApprovalEntity>,
    @InjectRepository(EquipmentFileEntity) private readonly files: Repository<EquipmentFileEntity>,
    private readonly equipment: EquipmentService,
  ) {}

  async list(query: ApprovalsQueryDto) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.equipment', 'equipment')
      .leftJoinAndSelect('a.project', 'project')
      .leftJoinAndSelect('a.requester', 'requester');
    if (query.projectId) qb.andWhere('a.projectId = :projectId', { projectId: query.projectId });
    if (query.status) qb.andWhere('a.status = :status', { status: query.status });
    qb.orderBy('a.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return paginated(rows.map((r) => this.toList(r)), total, query.page, query.pageSize);
  }

  async create(dto: CreateApprovalDto, requesterId: string) {
    const ids = [...new Set((dto.equipmentIds?.length ? dto.equipmentIds : dto.equipmentId ? [dto.equipmentId] : []))];
    if (!ids.length) {
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUIRED',
        message: 'Selecciona los equipos que se van a aprobar',
        details: [],
      });
    }
    const items = [];
    for (const id of ids) {
      items.push(await this.equipment.findOrThrow(id));
    }
    const projectId = items[0].projectId;
    if (items.some((eq) => eq.projectId !== projectId)) {
      throw new BadRequestException({
        code: 'MIXED_PROJECTS',
        message: 'Todos los equipos de la solicitud deben ser del mismo proyecto',
        details: [],
      });
    }
    const row = this.repo.create({
      equipmentId: items[0].id,
      equipmentIds: ids,
      projectId,
      requesterId,
      notes: dto.notes ?? null,
      status: 'En revisión',
    });
    const saved = await this.repo.save(row);
    for (const eq of items) {
      await this.equipment.setStatus(eq.id, 'En evaluación');
    }
    return this.get(saved.id);
  }

  async get(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) {
      throw new NotFoundException({ code: 'APPROVAL_NOT_FOUND', message: 'Solicitud no encontrada', details: [] });
    }
    const files = await this.files.find({ where: { equipmentId: a.equipmentId } });
    return {
      ...this.toList(a),
      notes: a.notes,
      observations: a.observations,
      reviewCode: a.reviewCode,
      comments: a.comments,
      reviewedBy: a.reviewedBy,
      reviewedAt: a.reviewedAt,
      project: a.project
        ? { id: a.project.id, name: a.project.name, client: a.project.client, location: a.project.location }
        : null,
      equipment: a.equipment
        ? {
            id: a.equipment.id,
            name: a.equipment.name,
            model: a.equipment.model,
            proceso: a.equipment.proceso,
            status: a.equipment.status,
            specs: a.equipment.specs,
          }
        : null,
      files: files.map((f) => ({
        id: f.id,
        category: f.category,
        name: f.name,
        type: f.type,
        size: Number(f.size),
      })),
    };
  }

  async update(id: string, dto: UpdateApprovalDto) {
    const a = await this.findOrThrow(id);
    if (dto.observations !== undefined) a.observations = dto.observations;
    if (dto.notes !== undefined) a.notes = dto.notes;
    await this.repo.save(a);
    return this.get(id);
  }

  async review(id: string, dto: ReviewApprovalDto) {
    const a = await this.findOrThrow(id);
    a.reviewCode = dto.code;
    a.comments = dto.comments;
    a.reviewedBy = dto.reviewedBy;
    a.reviewedAt = new Date();
    a.status = mapReview(dto.code);
    if (dto.code === 3) a.observations = dto.comments;
    await this.repo.save(a);
    const ids = a.equipmentIds?.length ? a.equipmentIds : [a.equipmentId];
    if (a.status === 'Aprobada') {
      for (const id of ids) await this.equipment.setStatus(id, 'Aprobado');
    }
    if (a.status === 'Rechazada') {
      for (const id of ids) await this.equipment.setStatus(id, 'Rechazado');
    }
    return this.get(id);
  }

  async exportPlaceholder(id: string, format: string) {
    const a = await this.get(id);
    return {
      format: format === 'docx' ? 'docx' : 'pdf',
      message: 'Exportación SAE pendiente de plantilla (fase 2). Use el payload hidratado en el cliente.',
      approval: a,
    };
  }

  private async findOrThrow(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) {
      throw new NotFoundException({ code: 'APPROVAL_NOT_FOUND', message: 'Solicitud no encontrada', details: [] });
    }
    return a;
  }

  private toList(a: ApprovalEntity) {
    const equipmentIds = a.equipmentIds?.length ? a.equipmentIds : a.equipmentId ? [a.equipmentId] : [];
    return {
      id: a.id,
      equipmentId: a.equipmentId,
      equipmentIds,
      projectId: a.projectId,
      requesterId: a.requesterId,
      requester: a.requester ? { id: a.requester.id, name: a.requester.name, email: a.requester.email } : null,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}
