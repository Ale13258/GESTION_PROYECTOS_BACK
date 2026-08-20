import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ProjectEntity } from '../../projects/domain/project.entity';
import { EquipmentEntity } from '../../equipment/domain/equipment.entity';
import { SupplierEntity } from '../../suppliers/domain/supplier.entity';
import { QuotationEntity } from '../../quotations/domain/quotation.entity';
import { ComparisonEntity } from '../../comparisons/domain/comparison.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ProjectEntity) private readonly projects: Repository<ProjectEntity>,
    @InjectRepository(EquipmentEntity) private readonly equipment: Repository<EquipmentEntity>,
    @InjectRepository(SupplierEntity) private readonly suppliers: Repository<SupplierEntity>,
    @InjectRepository(QuotationEntity) private readonly quotations: Repository<QuotationEntity>,
    @InjectRepository(ComparisonEntity) private readonly comparisons: Repository<ComparisonEntity>,
  ) {}

  async dashboard() {
    const [
      activeProjects,
      registeredEquipment,
      suppliers,
      pendingQuotations,
      approvedEquipment,
      rejectedEquipment,
    ] = await Promise.all([
      this.projects.count({ where: { status: 'Activo' } }),
      this.equipment.count(),
      this.suppliers.count(),
      this.quotations.count({ where: { status: 'Pendiente' } }),
      this.equipment.count({ where: { status: 'Aprobado' } }),
      this.equipment.count({ where: { status: 'Rechazado' } }),
    ]);
    return {
      activeProjects,
      registeredEquipment,
      suppliers,
      pendingQuotations,
      approvedEquipment,
      rejectedEquipment,
    };
  }

  async summary() {
    const projects = await this.projects.find({ order: { name: 'ASC' } });
    const result = [];
    for (const p of projects) {
      const eqs = await this.equipment.find({ where: { projectId: p.id } });
      const qs = await this.quotations.find({ where: { projectId: p.id } });
      const comps = await this.comparisons.count({ where: { projectId: p.id } });
      const totalQuoted = qs.filter((q) => q.isFinal).reduce((s, q) => s + Number(q.amount), 0);
      result.push({
        projectId: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        equipment: eqs.length,
        approved: eqs.filter((e) => e.status === 'Aprobado').length,
        pending: eqs.filter((e) => e.status === 'Pendiente' || e.status === 'En evaluación').length,
        quotations: qs.length,
        totalQuoted,
        comparisons: comps,
      });
    }
    return { currency: 'COP', projects: result };
  }

  async export(format: string) {
    const data = await this.summary();
    if (format === 'csv') {
      const header = 'proyecto,estado,progreso,equipos,aprobados,pendientes,cotizaciones,valorFinal,matrices';
      const lines = data.projects.map(
        (p) =>
          `"${p.name}",${p.status},${p.progress},${p.equipment},${p.approved},${p.pending},${p.quotations},${p.totalQuoted},${p.comparisons}`,
      );
      return { format: 'csv', content: [header, ...lines].join('\n') };
    }
    return { format: 'pdf', message: 'Exportación PDF de reportes (fase 2).', data };
  }

  async search(q: string) {
    const term = `%${q}%`;
    const [projects, equipment, suppliers] = await Promise.all([
      this.projects.find({
        where: [{ name: ILike(term) }, { client: ILike(term) }, { location: ILike(term) }],
        take: 8,
      }),
      this.equipment.find({
        where: [{ name: ILike(term) }, { model: ILike(term) }, { proceso: ILike(term) }],
        take: 8,
      }),
      this.suppliers.find({
        where: [{ name: ILike(term) }, { email: ILike(term) }, { contactName: ILike(term) }],
        take: 8,
      }),
    ]);
    return {
      q,
      projects: projects.map((p) => ({ id: p.id, name: p.name, client: p.client, status: p.status })),
      equipment: equipment.map((e) => ({ id: e.id, name: e.name, model: e.model, status: e.status, projectId: e.projectId })),
      suppliers: suppliers.map((s) => ({ id: s.id, name: s.name, country: s.country })),
    };
  }
}
