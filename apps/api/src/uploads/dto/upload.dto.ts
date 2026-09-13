import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber } from "class-validator";

export class CreateUploadDto {
  @ApiProperty() @IsString() filename!: string;
  @ApiProperty() @IsString() thumbnailS3Key!: string;
  @ApiProperty() @IsString() thumbnailUrl!: string;
}

export class UpdateUploadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() filename?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailS3Key?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
}

export class PresignedUploadDto {
  @ApiProperty() @IsString() filename!: string;
  @ApiProperty() @IsString() contentType!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() folder?: string;
}

export class PresignedDownloadDto {
  @ApiProperty() @IsString() s3Key!: string;
}

export class ConfirmUploadDto {
  @ApiProperty() @IsString() s3Key!: string;
  @ApiProperty() @IsString() filename!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailS3Key?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() size?: number;
}
