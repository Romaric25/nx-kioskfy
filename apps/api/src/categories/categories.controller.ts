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
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { OptionalAuth, AuthGuard, Roles } from "@thallesp/nestjs-better-auth";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @OptionalAuth()
  @ApiOperation({ summary: "Récupérer toutes les catégories" })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(":id")
  @OptionalAuth()
  @ApiOperation({ summary: "Récupérer une catégorie par ID" })
  @ApiParam({ name: "id", type: Number })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoriesService.findById(id);
  }

  @Get("slug/:slug")
  @OptionalAuth()
  @ApiOperation({ summary: "Récupérer une catégorie par slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Créer une nouvelle catégorie" })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(":id")
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Mettre à jour une catégorie" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Supprimer une catégorie" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
