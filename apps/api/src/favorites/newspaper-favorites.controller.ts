import { Controller, Get, Post, Delete, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Session, AuthGuard, type UserSession } from "@thallesp/nestjs-better-auth";
import type { auth } from "../auth";
import { FavoritesService } from "./favorites.service";

type AuthSession = UserSession<typeof auth>;

@ApiTags("Favorites")
@Controller("favorites")
@UseGuards(AuthGuard)
export class NewspaperFavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: "Récupérer les journaux favoris" })
  getUserFavorites(@Session() session: AuthSession) {
    return this.favoritesService.getNewspaperFavorites(session.user.id);
  }

  @Get("check/:newspaperId")
  @ApiOperation({ summary: "Vérifier si un journal est en favori" })
  checkFavorite(
    @Session() session: AuthSession,
    @Param("newspaperId") newspaperId: string,
  ) {
    return this.favoritesService.checkNewspaperFavorite(session.user.id, newspaperId);
  }

  @Post(":newspaperId")
  @ApiOperation({ summary: "Ajouter un journal aux favoris" })
  addFavorite(
    @Session() session: AuthSession,
    @Param("newspaperId") newspaperId: string,
  ) {
    return this.favoritesService.addNewspaperFavorite(session.user.id, newspaperId);
  }

  @Delete(":newspaperId")
  @ApiOperation({ summary: "Retirer un journal des favoris" })
  removeFavorite(
    @Session() session: AuthSession,
    @Param("newspaperId") newspaperId: string,
  ) {
    return this.favoritesService.removeNewspaperFavorite(session.user.id, newspaperId);
  }

  @Post(":newspaperId/toggle")
  @ApiOperation({ summary: "Basculer le statut favori d'un journal" })
  toggleFavorite(
    @Session() session: AuthSession,
    @Param("newspaperId") newspaperId: string,
  ) {
    return this.favoritesService.toggleNewspaperFavorite(session.user.id, newspaperId);
  }
}
