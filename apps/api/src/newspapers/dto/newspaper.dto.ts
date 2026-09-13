import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsArray, IsOptional, MinLength, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export enum NewspaperStatus {
  PUBLISHED = "published",
  DRAFT = "draft",
  PENDING = "pending",
  ARCHIVED = "archived",
}

export class CreateNewspaperDto {
  @ApiProperty({ example: "Édition #42" })
  @IsString() @MinLength(1)
  issueNumber!: string;

  @ApiProperty({ example: "2025-06-15" })
  @IsString() @MinLength(1)
  publishDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  coverImageUploadId?: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  price!: number;

  @ApiProperty({ enum: NewspaperStatus, default: NewspaperStatus.DRAFT })
  @IsString()
  status!: NewspaperStatus;

  @ApiPropertyOptional()
  @IsOptional()
  pdfUploadId?: number;

  @ApiProperty({ example: [1, 2] })
  @IsArray() @IsNumber({}, { each: true })
  categoryIds!: number[];

  @ApiProperty()
  @IsString() @MinLength(1)
  organizationId!: string;

  @ApiProperty()
  @IsString() @MinLength(1)
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  autoPublish?: boolean;
}

export class UpdateNewspaperDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MinLength(1)
  issueNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  publishDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  coverImageUploadId?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: NewspaperStatus })
  @IsOptional() @IsString()
  status?: NewspaperStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  pdfUploadId?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsArray() @IsNumber({}, { each: true })
  categoryIds?: number[];

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  autoPublish?: boolean;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: NewspaperStatus })
  @IsString()
  status!: NewspaperStatus;
}

export class PaginationQuery {
  @ApiPropertyOptional({ type: Number, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cursor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excludeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  includeAllStatuses?: string;
}
