import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { ReportsService } from './application/reports.service';
import { IsOptional, IsString, MinLength } from 'class-validator';

class SearchQuery {
  @IsString()
  @MinLength(1)
  q: string;
}

class ExportQuery {
  @IsOptional()
  @IsString()
  format?: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @RequirePermissions('viewReports')
  @Get('dashboard/stats')
  dashboard() {
    return this.reports.dashboard();
  }

  @RequirePermissions('viewReports')
  @Get('reports/summary')
  summary() {
    return this.reports.summary();
  }

  @RequirePermissions('viewReports')
  @Get('reports/export')
  export(@Query() query: ExportQuery) {
    return this.reports.export(query.format || 'csv');
  }

  @Get('search')
  search(@Query() query: SearchQuery) {
    return this.reports.search(query.q);
  }
}
