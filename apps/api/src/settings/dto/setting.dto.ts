import { ApiProperty } from "@nestjs/swagger";
import { IsObject } from "class-validator";

export class UpdateSettingsDto {
  @ApiProperty({ example: { site_name: "Kioskfy", maintenance_mode: true } })
  @IsObject()
  settings!: Record<string, any>;
}
