import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ProjectEntity } from '../domain/project.entity';
import { CreateProjectDto, ProjectsQueryDto, UpdateProjectDto } from '../dto/projects.dto';
import { paginated } from '../../../common/dto/pagination.dto';
import { DocumentEntity } from '../../documents/domain/document.entity';
import { EquipmentEntity } from '../../equipment/domain/equipment.entity';
import { QuotationEntity } from '../../quotations/domain/quotation.entity';
import { ComparisonEntity } from '../../comparisons/domain/comparison.entity';
import { UsersService } from '../../users/application/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity) private readonly repo: Repository<ProjectEntity>,
    @InjectRepository(DocumentEntity) private readonly docs: Repository<DocumentEntity>,
    @InjectRepository(EquipmentEntity) private readonly equipment: Repository<EquipmentEntity>,
    @InjectRepository(QuotationEntity) private readonly quotations: Repository<QuotationEntity>,
    @InjectRepository(ComparisonEntity) private readonly comparisons: Repository<ComparisonEntity>,
    private readonly users: UsersService,
  ) {}

  async list(query: ProjectsQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    const [rows, total] = await this.repo.findAndCount({
      where: query.q
        ? [
            { ...where, name: ILike(`%${query.q}%`) },
            { ...where, client: ILike(`%${query.q}%`) },
            { ...where, location: ILike(`%${query.q}%`) },
          ]
        : where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      order: { createdAt: 'DESC' },
    });
    const mapped = await Promise.all(rows.map((p) => this.withProgress(p)));
    return paginated(mapped, total, query.page, query.pageSize);
  }

  async create(dto: CreateProjectDto) {
    await this.users.findByIdOrThrow(dto.engineer);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const project = this.repo.create({
      name: dto.name,
      client: dto.client,
      location: dto.location,
      engineerId: dto.engineer,
      description: dto.description ?? null,
      status: 'Activo',
      progress: 0,
      startDate: today,
    });
    const saved = await this.repo.save(project);
    return this.withProgress(await this.findOrThrow(saved.id));
  }

  async get(id: string) {
    return this.withProgress(await this.findOrThrow(id));
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findOrThrow(id);
    if (dto.engineer) await this.users.findByIdOrThrow(dto.engineer);
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.client !== undefined) project.client = dto.client;
    if (dto.location !== undefined) project.location = dto.location;
    if (dto.engineer !== undefined) project.engineerId = dto.engineer;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.status !== undefined) project.status = dto.status;
    await this.repo.save(project);
    return this.withProgress(await this.findOrThrow(id));
  }

  async indicators(id: string) {
    await this.findOrThrow(id);
    const [docCount, equipment, quotations, comparisons] = await Promise.all([
      this.docs.count({ where: { projectId: id } }),
      this.equipment.find({ where: { projectId: id } }),
      this.quotations.find({ where: { projectId: id } }),
      this.comparisons.count({ where: { projectId: id } }),
    ]);
    const documentProgress = Math.min(100, Math.round((docCount / 12) * 100));
    const registered = equipment.filter((e) => e.status === 'Registrado').length;
    const approved = equipment.filter((e) => e.status === 'Aprobado').length;
    const pending = equipment.filter((e) => e.status === 'Pendiente' || e.status === 'En evaluación').length;
    const finalQuotes = quotations.filter((q) => q.isFinal);
    const totalQuoted = finalQuotes.reduce((s, q) => s + Number(q.amount), 0);
    const suppliersEvaluated = new Set(quotations.map((q) => q.supplierId)).size;
    const avgAnalysisDays = this.avgAnalysisDays(equipment);
    return {
      documentProgress,
      registered,
      approved,
      pending,
      totalQuoted,
      suppliersEvaluated,
      comparisons,
      avgAnalysisDays,
    };
  }

  async refreshProgress(projectId: string) {
    const indicators = await this.indicators(projectId);
    const equipment = await this.equipment.count({ where: { projectId } });
    const approvalRatio = equipment === 0 ? 0 : Math.round((indicators.approved / equipment) * 100);
    const progress = Math.round((indicators.documentProgress + approvalRatio) / 2);
    await this.repo.update(projectId, { progress });
    return progress;
  }

  async findOrThrow(id: string) {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Proyecto no encontrado', details: [] });
    }
    return project;
  }

  private async withProgress(project: ProjectEntity) {
    const progress = await this.refreshProgress(project.id);
    return {
      id: project.id,
      name: project.name,
      client: project.client,
      location: project.location,
      engineer: project.engineer
        ? { id: project.engineer.id, name: project.engineer.name, email: project.engineer.email }
        : { id: project.engineerId },
      description: project.description,
      status: project.status,
      progress,
      startDate: project.startDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private avgAnalysisDays(equipment: EquipmentEntity[]) {
    const days = equipment.map((e) => {
      const start = e.createdAt.getTime();
      const end = e.updatedAt.getTime();
      return Math.max(0, Math.round((end - start) / 86400000));
    });
    if (!days.length) return 0;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }
}
