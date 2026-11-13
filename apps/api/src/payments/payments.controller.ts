import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Khóa duy nhất cho mỗi giao dịch thanh toán (tối đa 255 ký tự)',
    required: true,
    example: 'payment-test-001',
  })
  create(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key')
    idempotencyKey: string | undefined,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(
      request.user.userId,
      idempotencyKey ?? '',
      dto,
    );
  }

  @Get('orders/:orderId/status')
  getOrderPaymentStatus(
    @Req() request: AuthenticatedRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getOrderPaymentStatus(
      request.user.userId,
      orderId,
    );
  }
}