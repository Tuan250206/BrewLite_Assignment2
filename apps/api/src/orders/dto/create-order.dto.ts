import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID('4', {
    message: 'productId phải là UUID hợp lệ',
  })
  productId!: string;

  @IsIn(['S', 'M', 'L'], {
    message: 'size chỉ được là S, M hoặc L',
  })
  size!: 'S' | 'M' | 'L';

  @IsOptional()
  @IsArray({
    message: 'topping phải là mảng',
  })
  @ArrayMaxSize(5, {
    message: 'Mỗi món chỉ được chọn tối đa 5 topping',
  })
  @ArrayUnique({
    message: 'Mỗi topping chỉ được chọn một lần',
  })
  @IsString({
    each: true,
    message: 'Mỗi topping phải là chuỗi',
  })
  topping?: string[];

  @Type(() => Number)
  @IsInt({
    message: 'qty phải là số nguyên',
  })
  @Min(1, {
    message: 'qty phải lớn hơn hoặc bằng 1',
  })
  @Max(20, {
    message: 'qty không được vượt quá 20',
  })
  qty!: number;
}

export class CreateOrderDto {
  @IsArray({
    message: 'items phải là mảng',
  })
  @ArrayMinSize(1, {
    message: 'Giỏ hàng không được trống',
  })
  @ArrayMaxSize(20, {
    message: 'Đơn hàng chỉ được có tối đa 20 dòng sản phẩm',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
