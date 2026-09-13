import { IsString, IsOptional, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty({ example: "Politique" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: "politique" })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty({ example: "Landmark" })
  @IsString()
  @MinLength(1)
  icon!: string;

  @ApiPropertyOptional({ example: "#ff5733" })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: "Politique" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "politique" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @ApiPropertyOptional({ example: "Landmark" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  icon?: string;

  @ApiPropertyOptional({ example: "#ff5733" })
  @IsOptional()
  @IsString()
  color?: string;
}
