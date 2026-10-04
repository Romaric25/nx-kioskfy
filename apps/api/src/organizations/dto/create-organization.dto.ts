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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: "Métadonnées JSON (string)" })
  @IsOptional()
  @IsString()
  metadata?: string | null;
}
