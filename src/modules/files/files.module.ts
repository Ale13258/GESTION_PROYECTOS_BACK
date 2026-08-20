import { Module } from '@nestjs/common';
import { FilesService } from './application/files.service';
import { FilesController } from './files.controller';
import { LocalStorage } from './infrastructure/local.storage';
import { MinioStorage } from './infrastructure/minio.storage';
import { FirebaseStorage } from './infrastructure/firebase.storage';

@Module({
  controllers: [FilesController],
  providers: [FilesService, LocalStorage, MinioStorage, FirebaseStorage],
  exports: [FilesService],
})
export class FilesModule {}
