import {
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service.js';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Check API and database health',
  })
  @ApiResponse({
    status: 200,
    description: 'API and database are healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'Database is unavailable',
  })
  check() {
    return this.healthService.check();
  }
}