import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  APPROVAL_STATUS,
  DOCUMENT_FOLDERS,
  EQUIPMENT_STATUS,
  FILE_CATEGORIES,
  PLANT_PROCESSES,
  PROJECT_STATUS,
  QUOTATION_STATUS,
} from '../../common/constants';

@ApiTags('catalogs')
@ApiBearerAuth()
@Controller('catalogs')
export class CatalogsController {
  @Get('plant-processes')
  plantProcesses() {
    return PLANT_PROCESSES;
  }

  @Get('statuses')
  statuses() {
    return {
      project: PROJECT_STATUS,
      equipment: EQUIPMENT_STATUS,
      quotation: QUOTATION_STATUS,
      approval: APPROVAL_STATUS,
      documentFolders: DOCUMENT_FOLDERS,
      fileCategories: FILE_CATEGORIES,
    };
  }
}
