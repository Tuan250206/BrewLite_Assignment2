import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ format: 'password', description: 'At most 72 UTF-8 bytes' })
  @IsString()
  @IsNotEmpty()
  @IsByteLength(1, 72)
  password!: string;
}