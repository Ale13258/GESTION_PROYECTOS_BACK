import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export type Paginated<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { data, page, pageSize, total };
}
