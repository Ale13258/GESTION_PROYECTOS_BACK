import { Controller, Get, Query, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/auth.decorators';
import { FilesService } from './application/files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Public()
  @Get('stream')
  async stream(@Query('key') key: string, @Res() res: Response) {
    if (!key || key.includes('..')) throw new UnauthorizedException('Clave inválida');
    const buf = await this.files.get(key);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buf);
  }
}
