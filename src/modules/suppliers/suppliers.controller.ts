import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { SuppliersService } from './application/suppliers.service';
import { CreateSupplierDto, SuppliersQueryDto, UpdateSupplierDto } from './dto/suppliers.dto';

@ApiTags('suppliers')
@ApiBearerAuth()
@RequirePermissions('manageSuppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  list(@Query() query: SuppliersQueryDto) {
    return this.suppliers.list(query);
  }

  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliers.create(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliers.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliers.update(id, dto);
  }
}
