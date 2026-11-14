import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PayGatewayDto } from './dto/pay-gateway.dto.js';

@Injectable()
export class MockGatewayService {
  pay(dto: PayGatewayDto): { status: PaymentStatus } {
    // Mô phỏng cổng thanh toán: nếu simulateFail = true thì trả FAILED,
    // ngược lại trả SUCCESS. Trong thực tế đây là nơi gọi API của VNPay/MoMo...
    return {
      status: dto.simulateFail ? PaymentStatus.FAILED : PaymentStatus.SUCCESS,
    };
  }
}
