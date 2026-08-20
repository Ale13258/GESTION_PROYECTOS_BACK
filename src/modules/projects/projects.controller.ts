import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { ProjectsService } from './application/projects.service';
import { CreateProjectDto, ProjectsQueryDto, UpdateProjectDto } from './dto/projects.dto';

@ApiTags('projects')
@ApiBearerAuth()
@RequirePermissions('manageProjects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query() query: ProjectsQueryDto) {
    return this.projects.list(query);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Get(':id/indicators')
  indicators(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.indicators(id);
  }
}
