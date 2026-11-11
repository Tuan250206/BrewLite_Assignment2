import { Module } from '@nestjs/common';
import { MockGatewayController } from './mock-gateway.controller.js';
import { MockGatewayService } from './mock-gateway.service.js';

@Module({
  controllers: [MockGatewayController],
  providers: [MockGatewayService],
  exports: [MockGatewayService],
})
export class MockGatewayModule {}
