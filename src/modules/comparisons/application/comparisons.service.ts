import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ComparisonEntity } from '../domain/comparison.entity';
import { CreateComparisonDto, ComparisonsQueryDto } from '../dto/comparisons.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { EquipmentService } from '../../equipment/application/equipment.service';
import { EquipmentEntity } from '../../equipment/domain/equipment.entity';
import { ProjectsService } from '../../projects/application/projects.service';

@Injectable()
export class ComparisonsService {
  constructor(
    @InjectRepository(ComparisonEntity) private readonly repo: Repository<ComparisonEntity>,
    @InjectRepository(EquipmentEntity) private readonly equipmentRepo: Repository<EquipmentEntity>,
    private readonly equipment: EquipmentService,
    private readonly projects: ProjectsService,
  ) {}

  async create(dto: CreateComparisonDto) {
    await this.projects.findOrThrow(dto.projectId);
    if (new Set(dto.equipmentIds).size !== dto.equipmentIds.length) {
      throw new BadRequestException({ code: 'DUPLICATE_IDS', message: 'Equipos duplicados', details: [] });
    }
    const rows = await this.equipmentRepo.find({ where: { id: In(dto.equipmentIds) } });
    if (rows.length !== dto.equipmentIds.length) {
      throw new NotFoundException({ code: 'EQUIPMENT_NOT_FOUND', message: 'Algunos equipos no existen', details: [] });
    }
    const scores: Record<string, number> = { ...(dto.scores ?? {}) };
    for (const eq of rows) {
      if (scores[eq.id] == null) scores[eq.id] = this.equipment.score(eq);
    }
    const saved = await this.repo.save(
      this.repo.create({ projectId: dto.projectId, equipmentIds: dto.equipmentIds, scores }),
    );
    return this.get(saved.id);
  }

  async list(query: ComparisonsQueryDto) {
    const where = query.projectId ? { projectId: query.projectId } : {};
    const [rows, total] = await this.repo.findAndCount({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      order: { createdAt: 'DESC' },
    });
    return paginated(rows, total, query.page, query.pageSize);
  }

  async get(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) {
      throw new NotFoundException({ code: 'COMPARISON_NOT_FOUND', message: 'Matriz no encontrada', details: [] });
    }
    const items = await this.equipmentRepo.find({ where: { id: In(c.equipmentIds) }, relations: ['supplier'] });
    return {
      id: c.id,
      projectId: c.projectId,
      equipmentIds: c.equipmentIds,
      scores: c.scores,
      createdAt: c.createdAt,
      equipment: items.map((e) => ({
        id: e.id,
        name: e.name,
        model: e.model,
        proceso: e.proceso,
        status: e.status,
        specs: e.specs,
        supplier: e.supplier ? { id: e.supplier.id, name: e.supplier.name } : null,
        score: c.scores[e.id] ?? this.equipment.score(e),
      })),
    };
  }
}
