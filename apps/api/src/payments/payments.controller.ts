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
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
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