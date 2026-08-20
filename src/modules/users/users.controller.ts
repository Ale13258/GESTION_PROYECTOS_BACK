import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './application/users.service';
import { CreateUserDto, SetActiveDto, UpdateUserDto, UsersQueryDto } from './dto/users.dto';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';

@ApiTags('users')
@ApiBearerAuth()
@RequirePermissions('manageUsers')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: UsersQueryDto) {
    return this.users.list(query);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Patch(':id/active')
  setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.setActive(id, dto.active, user.id);
  }
}
