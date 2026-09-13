import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional } from "class-validator";

export class InitializePaymentDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: "XAF" })
  @IsString()
  currency!: string;

  @ApiProperty({ example: "Achat journal #42" })
  @IsString()
  description!: string;

  @ApiProperty({ example: "http://localhost:3000/callback" })
  @IsOptional() @IsString()
  callback_url?: string;

  @ApiProperty({ example: "pay_ref_123" })
  @IsString()
  external_reference!: string;
}

export class PaymentSuccessDto {
  @ApiProperty({ example: "pay_abc123" })
  @IsString()
  paymentId!: string;
}
