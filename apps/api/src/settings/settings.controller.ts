import { Controller, Get, Put, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard, Roles, Public } from "@thallesp/nestjs-better-auth";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/setting.dto";

@ApiTags("Settings")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Récupérer tous les paramètres" })
  getAll() { return this.settingsService.getAll(); }

  @Put()
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Mettre à jour des paramètres (admin)" })
  update(@Body() dto: UpdateSettingsDto) { return this.settingsService.update(dto.settings); }

  @Post("seed")
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Initialiser les paramètres par défaut" })
  async seed() { return { created: await this.settingsService.seed() }; }
}
