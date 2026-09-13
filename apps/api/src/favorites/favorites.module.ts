import { Module } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { FavoritesController } from "./favorites.controller";
import { NewspaperFavoritesController } from "./newspaper-favorites.controller";

@Module({
  controllers: [FavoritesController, NewspaperFavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
