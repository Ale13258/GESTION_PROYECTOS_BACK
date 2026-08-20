import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { QUOTATION_STATUS, QuotationStatus } from '../../../common/constants';

export class CreateQuotationDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  equipmentId: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNumber()
  deliveryDays: number;

  @ApiPropertyOptional({ enum: QUOTATION_STATUS })
  @IsOptional()
  @IsIn([...QUOTATION_STATUS])
  status?: QuotationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UpdateQuotationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryDays?: number;

  @ApiPropertyOptional({ enum: QUOTATION_STATUS })
  @IsOptional()
  @IsIn([...QUOTATION_STATUS])
  status?: QuotationStatus;
}

export class QuotationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
