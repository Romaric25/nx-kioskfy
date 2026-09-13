import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCountryDto {
  @ApiProperty({ example: "Cameroun", minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: "🇨🇲", minLength: 1 })
  @IsString()
  @MinLength(1)
  flag!: string;

  @ApiProperty({ example: "XAF", minLength: 1 })
  @IsString()
  @MinLength(1)
  currency!: string;

  @ApiProperty({ example: "CM", minLength: 1, maxLength: 3 })
  @IsString()
  @MinLength(1)
  @MaxLength(3)
  code!: string;

  @ApiPropertyOptional({ example: "cm" })
  @IsOptional()
  @IsString()
  host?: string | null;
}

export class UpdateCountryDto {
  @ApiPropertyOptional({ example: "Cameroun", minLength: 1 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "🇨🇲" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  flag?: string;

  @ApiPropertyOptional({ example: "XAF" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  currency?: string;

  @ApiPropertyOptional({ example: "CM" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(3)
  code?: string;

  @ApiPropertyOptional({ example: "cm" })
  @IsOptional()
  @IsString()
  host?: string | null;
}
