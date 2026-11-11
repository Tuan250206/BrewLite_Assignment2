import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PayGatewayDto } from './dto/pay-gateway.dto.js';
import { MockGatewayService } from './mock-gateway.service.js';

@ApiTags('Mock Gateway')
@Controller('mock-gateway')
export class MockGatewayController {
  constructor(
    private readonly mockGatewayService: MockGatewayService,
  ) {}

  @Post('pay')
  pay(@Body() dto: PayGatewayDto) {
    return this.mockGatewayService.pay(dto);
  }
}
