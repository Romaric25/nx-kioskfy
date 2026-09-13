import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsArray, ArrayMinSize, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  newspaperId!: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  price!: number;
}

export class BatchOrderDto {
  @ApiProperty({ type: [CreateOrderDto] })
  @IsArray()
  @ArrayMinSize(1)
  orders!: CreateOrderDto[];
}

export class UpdatePaymentIdDto {
  @ApiProperty({ example: ["order-id-1", "order-id-2"] })
  @IsArray()
  @IsString({ each: true })
  orderIds!: string[];

  @ApiProperty({ example: "pay_abc123" })
  @IsString()
  paymentId!: string;
}

export class PaginationQuery {
  @ApiPropertyOptional({ type: Number, example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ example: "completed" })
  @IsOptional()
  @IsString()
  status?: string;
}
