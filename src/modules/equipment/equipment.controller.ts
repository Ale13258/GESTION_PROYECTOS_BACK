import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { EquipmentService } from './application/equipment.service';
import {
  CreateEquipmentDto,
  EquipmentQueryDto,
  ImportEquipmentDto,
  NoteDto,
  StatusDto,
  UpdateEquipmentDto,
} from './dto/equipment.dto';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

class RemoteEquipmentFileDto {
  @IsString()
  category: string;

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

@ApiTags('equipment')
@ApiBearerAuth()
@RequirePermissions('manageInventory')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  list(@Query() query: EquipmentQueryDto) {
    return this.equipment.list(query);
  }

  @Post()
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipment.create(dto);
  }

  @Post('import')
  import(@Body() dto: ImportEquipmentDto) {
    return this.equipment.import(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipment.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipment.update(id, dto);
  }

  @Patch(':id/note')
  note(@Param('id', ParseUUIDPipe) id: string, @Body() dto: NoteDto) {
    return this.equipment.setNote(id, dto.nota);
  }

  @Patch(':id/status')
  status(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StatusDto) {
    return this.equipment.setStatus(id, dto.status);
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  addFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('category') category: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.equipment.addFile(id, category, file);
  }

  @Post(':id/files/remote')
  addRemoteFile(@Param('id', ParseUUIDPipe) id: string, @Body() body: RemoteEquipmentFileDto) {
    return this.equipment.addRemoteFile(id, body);
  }

  @Delete(':id/files/:fileId')
  removeFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.equipment.removeFile(id, fileId);
  }

  @Get(':id/files/:fileId/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    const file = await this.equipment.downloadFile(id, fileId);
    return new StreamableFile(file.buffer, {
      type: file.type,
      disposition: `inline; filename="${file.name.replace(/"/g, '')}"`,
    });
  }
}
