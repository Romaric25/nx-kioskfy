import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, IsInt, Min, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class CreateWithdrawalDto {
  @ApiProperty() @IsString() organizationId!: string;
  @ApiProperty() @IsNumber() @Min(1) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentDetails?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() externalReference?: string;
}

export class CancelWithdrawalDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

/** Traitement d'une demande par l'administration (admin / superadmin). */
export class TraiterWithdrawalDto {
  @ApiProperty({ enum: ["processing", "completed", "failed", "cancelled"] })
  @IsIn(["processing", "completed", "failed", "cancelled"])
  statut!: "processing" | "completed" | "failed" | "cancelled";

  @ApiPropertyOptional({ description: "Référence du versement PI-SPI effectué" })
  @IsOptional() @IsString() externalReference?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional({ description: "Motif en cas d'échec ou d'annulation" })
  @IsOptional() @IsString() reason?: string;
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
}
