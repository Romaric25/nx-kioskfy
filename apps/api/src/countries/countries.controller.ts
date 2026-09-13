import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { CountriesService } from "./countries.service";
import { CreateCountryDto, UpdateCountryDto } from "./dto/country.dto";
import { OptionalAuth, AuthGuard, Roles } from "@thallesp/nestjs-better-auth";

@ApiTags("Countries")
@Controller("countries")
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @OptionalAuth()
  @ApiOperation({ summary: "Récupérer tous les pays" })
  findAll() {
    return this.countriesService.findAll();
  }

  @Get(":id")
  @OptionalAuth()
  @ApiOperation({ summary: "Récupérer un pays par ID" })
  @ApiParam({ name: "id", type: Number })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.countriesService.findById(id);
  }

  @Get("slug/:slug")
  @OptionalAuth()
  @ApiOperation({ summary: "Récupérer un pays par slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.countriesService.findBySlug(slug);
  }

  @Get("code/:code")
  @OptionalAuth()
  @ApiOperation({ summary: "Récupérer un pays par code ISO" })
  findByCode(@Param("code") code: string) {
    return this.countriesService.findByCode(code);
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Créer un nouveau pays" })
  create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  @Put(":id")
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Mettre à jour un pays" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Supprimer un pays" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.countriesService.remove(id);
  }
}
