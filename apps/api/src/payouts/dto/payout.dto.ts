import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, IsObject } from "class-validator";

export class InitializePayoutDto {
  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  withdrawalId?: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: "XAF" })
  @IsString()
  currency!: string;

  @ApiProperty({ example: "Retrait fonds" })
  @IsString()
  description!: string;

  @ApiProperty({ example: { email: "user@mail.com", first_name: "Jean", last_name: "Dupont" } })
  @IsObject()
  customer!: Record<string, any>;

  @ApiProperty({ example: {} })
  @IsObject()
  recipient!: Record<string, any>;

  @ApiProperty({ example: {} })
  @IsObject()
  metadata!: Record<string, any>;

  @ApiProperty({ example: "mobile_money" })
  @IsString()
  method!: string;
}
