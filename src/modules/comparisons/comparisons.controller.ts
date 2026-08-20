import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { ComparisonsService } from './application/comparisons.service';
import { ComparisonsQueryDto, CreateComparisonDto } from './dto/comparisons.dto';

@ApiTags('comparisons')
@ApiBearerAuth()
@RequirePermissions('manageMatrices')
@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly comparisons: ComparisonsService) {}

  @Post()
  create(@Body() dto: CreateComparisonDto) {
    return this.comparisons.create(dto);
  }

  @Get()
  list(@Query() query: ComparisonsQueryDto) {
    return this.comparisons.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.comparisons.get(id);
  }
}
