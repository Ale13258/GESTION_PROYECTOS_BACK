import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './domain/document.entity';
import { DocumentsService } from './application/documents.service';
import { DocumentsController } from './documents.controller';
import { FilesModule } from '../files/files.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity]), FilesModule, ProjectsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
