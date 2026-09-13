import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { Session, AuthGuard, type UserSession } from "@thallesp/nestjs-better-auth";
import type { auth } from "../auth";
import { FavoritesService } from "./favorites.service";

type AuthSession = UserSession<typeof auth>;

@ApiTags("Favorite Countries")
@Controller("favorite-countries")
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: "Récupérer les pays favoris de l'utilisateur" })
  getFavorites(@Session() session: AuthSession) {
    return this.favoritesService.getUserFavorites(session.user.id);
  }

  @Get("all")
  @ApiOperation({ summary: "Récupérer tous les pays avec statut favori" })
  getAllWithStatus(@Session() session: AuthSession) {
    return this.favoritesService.getAllCountriesWithFavorites(session.user.id);
  }

  @Post(":countryId")
  @ApiOperation({ summary: "Ajouter un pays aux favoris" })
  @ApiParam({ name: "countryId", type: Number })
  addFavorite(
    @Session() session: AuthSession,
    @Param("countryId", ParseIntPipe) countryId: number,
  ) {
    return this.favoritesService.addFavorite(session.user.id, countryId);
  }

  @Delete(":countryId")
  @ApiOperation({ summary: "Retirer un pays des favoris" })
  @ApiParam({ name: "countryId", type: Number })
  removeFavorite(
    @Session() session: AuthSession,
    @Param("countryId", ParseIntPipe) countryId: number,
  ) {
    return this.favoritesService.removeFavorite(session.user.id, countryId);
  }

  @Post(":countryId/toggle")
  @ApiOperation({ summary: "Basculer le statut favori d'un pays" })
  @ApiParam({ name: "countryId", type: Number })
  toggleFavorite(
    @Session() session: AuthSession,
    @Param("countryId", ParseIntPipe) countryId: number,
  ) {
    return this.favoritesService.toggleFavorite(session.user.id, countryId);
  }

  @Get("newspapers")
  @ApiOperation({ summary: "Journaux des pays favoris" })
  getNewspapers(@Session() session: AuthSession) {
    return this.favoritesService.getNewspapersFromFavoriteCountries(session.user.id);
  }
}
