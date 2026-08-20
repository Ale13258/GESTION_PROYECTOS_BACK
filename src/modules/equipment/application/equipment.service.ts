import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EquipmentEntity } from '../domain/equipment.entity';
import { EquipmentEventEntity } from '../domain/equipment-event.entity';
import { EquipmentFileEntity } from '../domain/equipment-file.entity';
import { emptySpecs, EquipmentSpecs } from '../domain/equipment-specs';
import {
  CreateEquipmentDto,
  EquipmentQueryDto,
  ImportEquipmentDto,
  UpdateEquipmentDto,
} from '../dto/equipment.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { EQUIPMENT_STATUS, FILE_CATEGORIES, FileCategory } from '../../../common/constants';
import { FilesService } from '../../files/application/files.service';
import { equipmentFileStoragePath } from '../../files/storage-paths';
import { ProjectsService } from '../../projects/application/projects.service';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(EquipmentEntity) private readonly repo: Repository<EquipmentEntity>,
    @InjectRepository(EquipmentEventEntity) private readonly events: Repository<EquipmentEventEntity>,
    @InjectRepository(EquipmentFileEntity) private readonly filesRepo: Repository<EquipmentFileEntity>,
    private readonly files: FilesService,
    private readonly projects: ProjectsService,
  ) {}

  async list(query: EquipmentQueryDto) {
    if (query.ids) {
      const ids = query.ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length > 3) {
        throw new BadRequestException({
          code: 'TOO_MANY_IDS',
          message: 'El comparador admite máximo 3 equipos',
          details: [],
        });
      }
      const rows = await this.repo.find({ where: { id: In(ids) } });
      return paginated(rows.map((e) => this.toListDto(e)), rows.length, 1, rows.length);
    }
    const qb = this.repo.createQueryBuilder('e').leftJoinAndSelect('e.supplier', 'supplier');
    if (query.projectId) qb.andWhere('e.projectId = :projectId', { projectId: query.projectId });
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });
    if (query.proceso) qb.andWhere('e.proceso ILIKE :proceso', { proceso: `%${query.proceso}%` });
    if (query.q) {
      qb.andWhere('(e.name ILIKE :q OR e.model ILIKE :q)', { q: `%${query.q}%` });
    }
    qb.orderBy('e.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return paginated(rows.map((e) => this.toListDto(e)), total, query.page, query.pageSize);
  }

  async create(dto: CreateEquipmentDto) {
    await this.projects.findOrThrow(dto.projectId);
    const entity = this.repo.create({
      projectId: dto.projectId,
      name: dto.name,
      model: dto.model ?? null,
      proceso: dto.proceso,
      supplierId: dto.supplierId ?? null,
      precio: dto.precio != null ? String(dto.precio) : null,
      nota: dto.nota ?? null,
      specs: { ...emptySpecs(), ...dto.specs },
      status: 'Registrado',
    });
    const saved = await this.repo.save(entity);
    await this.addEvent(saved.id, 'Equipo registrado', 'info');
    await this.projects.refreshProgress(dto.projectId);
    return this.get(saved.id);
  }

  async import(dto: ImportEquipmentDto) {
    const created = [];
    for (const item of dto.items) {
      created.push(await this.create({ ...item, projectId: dto.projectId } as CreateEquipmentDto));
    }
    return { imported: created.length, data: created };
  }

  async get(id: string) {
    const eq = await this.repo.findOne({
      where: { id },
      relations: ['events', 'files', 'supplier', 'project'],
    });
    if (!eq) {
      throw new NotFoundException({ code: 'EQUIPMENT_NOT_FOUND', message: 'Equipo no encontrado', details: [] });
    }
    const files = (eq.files || []).filter((f) => !f.deletedAt);
    return {
      ...this.toListDto(eq),
      nota: eq.nota,
      files: files.map((f) => ({
        id: f.id,
        category: f.category,
        name: f.name,
        type: f.type,
        size: Number(f.size),
        createdAt: f.createdAt,
        url: f.storageKey.startsWith('http') ? f.storageKey : undefined,
      })),
      history: (eq.events || [])
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((ev) => ({ id: ev.id, date: ev.date, event: ev.event, tone: ev.tone })),
    };
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    const eq = await this.findOrThrow(id);
    if (dto.name !== undefined) eq.name = dto.name;
    if (dto.model !== undefined) eq.model = dto.model;
    if (dto.proceso !== undefined) eq.proceso = dto.proceso;
    if (dto.supplierId !== undefined) eq.supplierId = dto.supplierId;
    if (dto.precio !== undefined) eq.precio = String(dto.precio);
    if (dto.specs) eq.specs = { ...eq.specs, ...dto.specs } as EquipmentSpecs;
    await this.repo.save(eq);
    await this.addEvent(id, 'Ficha técnica actualizada', 'info');
    return this.get(id);
  }

  async setNote(id: string, nota: string) {
    const eq = await this.findOrThrow(id);
    eq.nota = nota;
    await this.repo.save(eq);
    await this.addEvent(id, 'Nota actualizada', 'info');
    return this.get(id);
  }

  async setStatus(id: string, status: (typeof EQUIPMENT_STATUS)[number]) {
    const eq = await this.findOrThrow(id);
    const prev = eq.status;
    eq.status = status;
    await this.repo.save(eq);
    const tone = status === 'Aprobado' ? 'success' : status === 'Rechazado' ? 'danger' : 'warning';
    await this.addEvent(id, `Estado: ${prev} → ${status}`, tone);
    await this.projects.refreshProgress(eq.projectId);
    return this.get(id);
  }

  async addFile(id: string, category: string, file: Express.Multer.File) {
    const eq = await this.findOrThrow(id);
    if (!FILE_CATEGORIES.includes(category as FileCategory)) {
      throw new BadRequestException({ code: 'INVALID_CATEGORY', message: 'Categoría de archivo no válida', details: [category] });
    }
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'Archivo requerido', details: [] });
    }
    const stored = await this.files.upload(
      equipmentFileStoragePath(eq.projectId, id, category),
      file,
    );
    const row = this.filesRepo.create({
      equipmentId: id,
      category: category as FileCategory,
      name: stored.originalName,
      type: stored.mimeType,
      size: stored.size,
      storageKey: stored.storageKey,
    });
    await this.filesRepo.save(row);
    await this.addEvent(id, `Archivo ${category} adjuntado`, 'info');
    return this.get(id);
  }

  async addRemoteFile(
    id: string,
    payload: { category: string; name: string; type: string; size: number; storageKey: string },
  ) {
    await this.findOrThrow(id);
    if (!FILE_CATEGORIES.includes(payload.category as FileCategory)) {
      throw new BadRequestException({ code: 'INVALID_CATEGORY', message: 'Categoría de archivo no válida', details: [payload.category] });
    }
    const row = this.filesRepo.create({
      equipmentId: id,
      category: payload.category as FileCategory,
      name: payload.name,
      type: payload.type || 'application/octet-stream',
      size: payload.size,
      storageKey: payload.storageKey,
    });
    await this.filesRepo.save(row);
    await this.addEvent(id, `Archivo ${payload.category} adjuntado`, 'info');
    return this.get(id);
  }

  async removeFile(equipmentId: string, fileId: string) {
    const file = await this.filesRepo.findOne({ where: { id: fileId, equipmentId } });
    if (!file) {
      throw new NotFoundException({ code: 'FILE_NOT_FOUND', message: 'Archivo no encontrado', details: [] });
    }
    await this.filesRepo.softRemove(file);
    return { ok: true };
  }

  async downloadFile(equipmentId: string, fileId: string) {
    const file = await this.filesRepo.findOne({ where: { id: fileId, equipmentId } });
    if (!file) {
      throw new NotFoundException({ code: 'FILE_NOT_FOUND', message: 'Archivo no encontrado', details: [] });
    }
    const buffer = await this.files.get(file.storageKey);
    return {
      buffer,
      name: file.name,
      type: file.type || 'application/octet-stream',
    };
  }

  async findOrThrow(id: string) {
    const eq = await this.repo.findOne({ where: { id } });
    if (!eq) {
      throw new NotFoundException({ code: 'EQUIPMENT_NOT_FOUND', message: 'Equipo no encontrado', details: [] });
    }
    return eq;
  }

  score(eq: EquipmentEntity) {
    const cumplimiento = eq.specs?.cumplimiento ?? 0;
    const entregaDias = eq.specs?.entregaDias ?? 0;
    const potencia = eq.specs?.potencia ?? 0;
    return cumplimiento * 2 - entregaDias + (100 - potencia);
  }

  private async addEvent(equipmentId: string, event: string, tone: string) {
    await this.events.save(
      this.events.create({ equipmentId, event, tone, date: new Date() }),
    );
  }

  private toListDto(e: EquipmentEntity) {
    return {
      id: e.id,
      projectId: e.projectId,
      name: e.name,
      model: e.model,
      proceso: e.proceso,
      status: e.status,
      precio: e.precio != null ? Number(e.precio) : null,
      supplierId: e.supplierId,
      supplier: e.supplier ? { id: e.supplier.id, name: e.supplier.name } : null,
      specs: e.specs,
      score: this.score(e),
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
