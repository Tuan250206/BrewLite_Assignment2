import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(
      request.user.userId,
      dto.items,
    );
  }

  @Get('me')
  findMine(@Req() request: AuthenticatedRequest) {
    return this.ordersService.findMine(
      request.user.userId,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.findOne(
      request.user.userId,
      orderId,
    );
  }

  @Patch(':id/retry-payment')
  retryPayment(
    @Req() request: AuthenticatedRequest,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.retryPayment(
      request.user.userId,
      orderId,
    );
  }

  @Patch(':id/cancel')
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.cancel(
      request.user.userId,
      orderId,
    );
  }
}