import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class PayGatewayDto {
  @IsUUID('4', {
    message: 'orderId phải là UUID hợp lệ',
  })
  orderId!: string;

  @IsNumber(
    {},
    {
      message: 'amount phải là số',
    },
  )
  amount!: number;

  @IsIn(['WALLET', 'CARD'], {
    message: 'method chỉ được là WALLET hoặc CARD',
  })
  method!: 'WALLET' | 'CARD';

  @IsOptional()
  @IsString({
    message: 'idempotencyKey phải là chuỗi',
  })
  idempotencyKey?: string;

  @IsOptional()
  @IsBoolean({
    message: 'simulateFail phải là true hoặc false',
  })
  simulateFail?: boolean;
}
