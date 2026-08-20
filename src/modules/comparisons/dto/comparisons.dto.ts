import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsObject, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateComparisonDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsUUID('4', { each: true })
  equipmentIds: string[];

  @ApiPropertyOptional({ description: 'Mapa equipmentId → score. Si se omite, se calcula la heurística del front.' })
  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;
}

export class ComparisonsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
