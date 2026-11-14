import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID('4', {
    message: 'orderId phải là UUID hợp lệ',
  })
  orderId!: string;

  @IsIn(['WALLET', 'CARD'], {
    message: 'method chỉ được là WALLET hoặc CARD',
  })
  method!: 'WALLET' | 'CARD';

  @IsOptional()
  @IsBoolean({
    message: 'simulateFail phải là true hoặc false',
  })
  simulateFail?: boolean;
}