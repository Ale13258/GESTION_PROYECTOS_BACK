import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { QuotationsService } from './application/quotations.service';
import { CreateQuotationDto, QuotationsQueryDto, UpdateQuotationDto } from './dto/quotations.dto';

@ApiTags('quotations')
@ApiBearerAuth()
@RequirePermissions('manageQuotations')
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get()
  list(@Query() query: QuotationsQueryDto) {
    return this.quotations.list(query);
  }

  @Get('summary')
  summary() {
    return this.quotations.summary();
  }

  @Post()
  create(@Body() dto: CreateQuotationDto) {
    return this.quotations.create(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotations.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotations.update(id, dto);
  }

  @Post(':id/mark-final')
  markFinal(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotations.markFinal(id);
  }
}
