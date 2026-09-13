import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEmail, IsBoolean, IsOptional, MinLength } from "class-validator";

export class CreatePartnershipDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiProperty() @IsString() @MinLength(2) lastName!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(1) phone!: string;
  @ApiProperty() @IsString() @MinLength(8) password!: string;
  @ApiProperty() @IsString() confirmPassword!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() typeUser?: string;
  @ApiProperty() @IsBoolean() termsAcceptance!: boolean;
}

export class ConfirmEmailDto {
  @ApiProperty() @IsString() token!: string;
}

export class ResendTokenDto {
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() token?: string;
}

export class UpdatePhoneDto {
  @ApiProperty() @IsString() @MinLength(1) phone!: string;
}

export class SetPasswordDto {
  @ApiProperty() @IsString() @MinLength(8) password!: string;
}
