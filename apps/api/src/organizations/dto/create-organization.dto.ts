import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateOrganizationDto {
  @ApiProperty({ example: "Presse du Bénin" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ description: "Slug optionnel (généré depuis le nom si absent)" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @ApiProperty({ example: "contact@agence.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "+229 96 73 34 18" })
  @IsString()
  @MinLength(1)
  phone!: string;

  @ApiProperty({ example: "Bénin" })
  @IsString()
  @MinLength(1)
  country!: string;

  @ApiProperty({ example: "Cotonou, Bénin" })
  @IsString()
  @MinLength(1)
  address!: string;

  @ApiProperty({ example: "Agence de presse généraliste..." })
  @IsString()
  @MinLength(1)
  description!: string;

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

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({ description: "Métadonnées JSON (string)" })
  @IsOptional()
  @IsString()
  metadata?: string | null;
}
