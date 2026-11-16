import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

/**
 * Body of `PUT /api/organizations/:organizationId`.
 * Tous les champs sont optionnels : seuls les champs fournis sont modifiés.
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: "Presse du Bénin" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "contact@agence.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+229 96 73 34 18" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;

  @ApiPropertyOptional({ example: "Bénin" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  country?: string;

  @ApiPropertyOptional({ example: "Cotonou, Bénin" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  address?: string;

  @ApiPropertyOptional({ example: "Agence de presse généraliste..." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 250 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description:
      "Prix fixe du journal, hors commission kioskfy (montant net par exemplaire)",
    example: 250,
  })
  @IsOptional()
  @IsNumber()
  newspaperPrice?: number;

  @ApiPropertyOptional({ description: "URL publique du logo" })
  @IsOptional()
  @IsString()
  logo?: string | null;

  @ApiPropertyOptional({ description: "ID de l'enregistrement d'upload du logo" })
  @IsOptional()
  @IsNumber()
  logoUploadId?: number;

  @ApiPropertyOptional({
    description:
      "Alias PI-SPI (BCEAO) de l'agence, ex. alias SHID du compte qui reçoit les gains",
    example: "8350050d-6f94-481c-8caa-2b59b1a3664e",
  })
  @IsOptional()
  @IsString()
  pispiAlias?: string | null;

  @ApiPropertyOptional({ description: "Métadonnées JSON (string)" })
  @IsOptional()
  @IsString()
  metadata?: string | null;
}
