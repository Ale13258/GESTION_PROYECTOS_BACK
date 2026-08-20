import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { DocumentsService } from './application/documents.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class FolderDto {
  @IsString()
  folder: string;
}

class RemoteDocumentDto {
  @IsString()
  folder: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  size: number;

  @IsString()
  storageKey: string;
}

class DocumentsQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  folder?: string;
}

@ApiTags('documents')
@ApiBearerAuth()
@RequirePermissions('manageProjects')
@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get('projects/:id/documents')
  list(@Param('id', ParseUUIDPipe) id: string, @Query() query: DocumentsQuery) {
    return this.documents.list(id, query.folder, query);
  }

  @Post('projects/:id/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
      },
    },
  })
  upload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: FolderDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documents.upload(id, body.folder, file);
  }

  @Post('projects/:id/documents/remote')
  registerRemote(@Param('id', ParseUUIDPipe) id: string, @Body() body: RemoteDocumentDto) {
    return this.documents.registerRemote(id, body);
  }

  @Get('documents/:id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.documents.get(id);
  }

  @Get('documents/:id/download')
  async download(@Param('id', ParseUUIDPipe) id: string) {
    const file = await this.documents.download(id);
    return new StreamableFile(file.buffer, {
      type: file.type,
      disposition: `inline; filename="${file.name.replace(/"/g, '')}"`,
    });
  }

  @Delete('documents/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documents.remove(id);
  }
}
