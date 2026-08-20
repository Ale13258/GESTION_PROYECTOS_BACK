import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EQUIPMENT_STATUS, EquipmentStatus } from '../../../common/constants';

export class SpecsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caudal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  potencia?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  voltaje?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rpm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  garantia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  entregaDias?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cumplimiento?: number;
}

export class CreateEquipmentDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty()
  @IsString()
  proceso: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SpecsDto)
  specs?: SpecsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;
}

export class EquipmentImportItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty()
  @IsString()
  proceso: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SpecsDto)
  specs?: SpecsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;
}

export class ImportEquipmentDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ type: [EquipmentImportItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EquipmentImportItemDto)
  items: EquipmentImportItemDto[];
}

export class UpdateEquipmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proceso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SpecsDto)
  specs?: SpecsDto;
}

export class NoteDto {
  @ApiProperty()
  @IsString()
  nota: string;
}

export class StatusDto {
  @ApiProperty({ enum: EQUIPMENT_STATUS })
  @IsIn([...EQUIPMENT_STATUS])
  status: EquipmentStatus;
}

export class EquipmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proceso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'CSV de UUIDs, máx. 3 (comparador)' })
  @IsOptional()
  @IsString()
  ids?: string;
}
