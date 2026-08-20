import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ROLE } from '../../../common/constants';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: [ROLE.ADMIN, ROLE.COLLABORATOR] })
  @IsOptional()
  @IsIn([ROLE.ADMIN, ROLE.COLLABORATOR])
  role?: typeof ROLE.ADMIN | typeof ROLE.COLLABORATOR;
}

export class SetActiveDto {
  @ApiProperty()
  @IsBoolean()
  active: boolean;
}

export class UsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  active?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;
}
