import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from '../domain/document.entity';
import { DOCUMENT_FOLDERS, DocumentFolder } from '../../../common/constants';
import { FilesService } from '../../files/application/files.service';
import { projectDocumentStoragePath } from '../../files/storage-paths';
import { ProjectsService } from '../../projects/application/projects.service';
import { PaginationQueryDto, paginated } from '../../../common/dto/pagination.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity) private readonly repo: Repository<DocumentEntity>,
    private readonly files: FilesService,
    private readonly projects: ProjectsService,
  ) {}

  async list(projectId: string, folder: string | undefined, query: PaginationQueryDto) {
    await this.projects.findOrThrow(projectId);
    const where: Record<string, unknown> = { projectId };
    if (folder) {
      if (!DOCUMENT_FOLDERS.includes(folder as DocumentFolder)) {
        throw new BadRequestException({ code: 'INVALID_FOLDER', message: 'Carpeta no válida', details: [folder] });
      }
      where.folder = folder;
    }
    const [rows, total] = await this.repo.findAndCount({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      order: { updatedAt: 'DESC' },
    });
    return paginated(rows.map(this.toDto), total, query.page, query.pageSize);
  }

  async upload(projectId: string, folder: string, file: Express.Multer.File) {
    const project = await this.projects.findOrThrow(projectId);
    if (!DOCUMENT_FOLDERS.includes(folder as DocumentFolder)) {
      throw new BadRequestException({ code: 'INVALID_FOLDER', message: 'Carpeta no válida', details: [folder] });
    }
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'Archivo requerido', details: [] });
    }
    const stored = await this.files.upload(
      projectDocumentStoragePath(projectId, folder, project.name),
      file,
    );
    const doc = this.repo.create({
      projectId,
      folder: folder as DocumentFolder,
      name: stored.originalName,
      type: stored.mimeType,
      size: stored.size,
      storageKey: stored.storageKey,
    });
    const saved = await this.repo.save(doc);
    await this.projects.refreshProgress(projectId);
    return this.toDto(saved);
  }

  async registerRemote(
    projectId: string,
    payload: { folder: string; name: string; type: string; size: number; storageKey: string },
  ) {
    await this.projects.findOrThrow(projectId);
    if (!DOCUMENT_FOLDERS.includes(payload.folder as DocumentFolder)) {
      throw new BadRequestException({ code: 'INVALID_FOLDER', message: 'Carpeta no válida', details: [payload.folder] });
    }
    if (!payload.storageKey) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'Archivo requerido', details: [] });
    }
    const doc = this.repo.create({
      projectId,
      folder: payload.folder as DocumentFolder,
      name: payload.name,
      type: payload.type || 'application/octet-stream',
      size: payload.size,
      storageKey: payload.storageKey,
    });
    const saved = await this.repo.save(doc);
    await this.projects.refreshProgress(projectId);
    return this.toDto(saved);
  }

  async get(id: string) {
    return this.toDto(await this.findOrThrow(id));
  }

  async updateStorageKey(id: string, storageKey: string) {
    const doc = await this.findOrThrow(id);
    doc.storageKey = storageKey;
    return this.toDto(await this.repo.save(doc));
  }

  async download(id: string) {
    const doc = await this.findOrThrow(id);
    const buffer = await this.files.get(doc.storageKey);
    return {
      buffer,
      name: doc.name,
      type: doc.type || 'application/octet-stream',
    };
  }

  async remove(id: string) {
    const doc = await this.findOrThrow(id);
    await this.repo.softRemove(doc);
    await this.projects.refreshProgress(doc.projectId);
    return { ok: true };
  }

  async findOrThrow(id: string) {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException({ code: 'DOCUMENT_NOT_FOUND', message: 'Documento no encontrado', details: [] });
    }
    return doc;
  }

  private toDto(doc: DocumentEntity) {
    return {
      id: doc.id,
      projectId: doc.projectId,
      folder: doc.folder,
      name: doc.name,
      type: doc.type,
      size: Number(doc.size),
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      url: doc.storageKey.startsWith('http') ? doc.storageKey : undefined,
    };
  }
}
