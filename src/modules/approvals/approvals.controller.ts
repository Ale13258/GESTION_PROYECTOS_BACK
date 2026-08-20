import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { ApprovalsService } from './application/approvals.service';
import { ApprovalsQueryDto, CreateApprovalDto, ReviewApprovalDto, UpdateApprovalDto } from './dto/approvals.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';

@ApiTags('approvals')
@ApiBearerAuth()
@RequirePermissions('manageApprovals')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  list(@Query() query: ApprovalsQueryDto) {
    return this.approvals.list(query);
  }

  @Post()
  create(@Body() dto: CreateApprovalDto, @CurrentUser() user: AuthUser) {
    return this.approvals.create(dto, user.id);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvals.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApprovalDto) {
    return this.approvals.update(id, dto);
  }

  @Post(':id/review')
  review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewApprovalDto) {
    return this.approvals.review(id, dto);
  }

  @Get(':id/export')
  export(@Param('id', ParseUUIDPipe) id: string, @Query('format') format = 'pdf') {
    return this.approvals.exportPlaceholder(id, format);
  }
}
