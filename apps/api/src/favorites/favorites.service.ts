import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { DRIZZLE } from "../db";
import {
  userFavoriteCountries,
  countries,
  newspapers,
  favorites,
} from "../db/app-schema";
import { eq, and, inArray } from "drizzle-orm";
import type { Database } from "../db";

@Injectable()
export class FavoritesService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async getUserFavorites(userId: string) {
    const favorites = await this.db.query.userFavoriteCountries.findMany({
      where: eq(userFavoriteCountries.userId, userId),
      with: { country: true },
      orderBy: (ufc, { desc }) => [desc(ufc.createdAt)],
    });
    return favorites.map((f) => f.country);
  }

  async getAllCountriesWithFavorites(userId: string) {
    const allCountries = await this.db.query.countries.findMany({
      orderBy: (c, { asc }) => [asc(c.name)],
    });

    const userFavorites = await this.db.query.userFavoriteCountries.findMany({
      where: eq(userFavoriteCountries.userId, userId),
    });

    const favoriteIds = new Set(userFavorites.map((f) => f.countryId));

    return allCountries.map((c) => ({
      ...c,
      isFavorite: favoriteIds.has(c.id),
    }));
  }

  async addFavorite(userId: string, countryId: number) {
    const country = await this.db.query.countries.findFirst({
      where: eq(countries.id, countryId),
    });
    if (!country) throw new NotFoundException("Pays non trouvé");

    const existing = await this.db.query.userFavoriteCountries.findFirst({
      where: and(
        eq(userFavoriteCountries.userId, userId),
        eq(userFavoriteCountries.countryId, countryId),
      ),
    });
    if (existing) return { isFavorite: true };

    await this.db.insert(userFavoriteCountries).values({ userId, countryId });
    return { isFavorite: true };
  }

  async removeFavorite(userId: string, countryId: number) {
    await this.db
      .delete(userFavoriteCountries)
      .where(
        and(
          eq(userFavoriteCountries.userId, userId),
          eq(userFavoriteCountries.countryId, countryId),
        ),
      );
    return { isFavorite: false };
  }

  async toggleFavorite(userId: string, countryId: number) {
    const country = await this.db.query.countries.findFirst({
      where: eq(countries.id, countryId),
    });
    if (!country) throw new NotFoundException("Pays non trouvé");

    const existing = await this.db.query.userFavoriteCountries.findFirst({
      where: and(
        eq(userFavoriteCountries.userId, userId),
        eq(userFavoriteCountries.countryId, countryId),
      ),
    });

    if (existing) {
      await this.removeFavorite(userId, countryId);
      return { isFavorite: false, message: "Pays retiré des favoris" };
    } else {
      await this.addFavorite(userId, countryId);
      return { isFavorite: true, message: "Pays ajouté aux favoris" };
    }
  }

  async getNewspapersFromFavoriteCountries(userId: string) {
    const favs = await this.db.query.userFavoriteCountries.findMany({
      where: eq(userFavoriteCountries.userId, userId),
    });

    if (favs.length === 0) return [];

    const countryIds = favs.map((f) => f.countryId);

    return this.db.query.newspapers.findMany({
      where: and(
        inArray(newspapers.countryId, countryIds),
        eq(newspapers.status as any, "published"),
      ),
      with: {
        organization: true,
        country: true,
        categories: { with: { category: true } },
      },
      orderBy: (n, { desc }) => [desc(n.publishDate)],
      limit: 12,
    });
  }

  // ── Newspaper favorites ──────────────────────────────────────────────

  async getNewspaperFavorites(userId: string) {
    const userFavs = await this.db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      with: {
        newspaper: {
          with: {
            organization: true,
            country: true,
            categories: { with: { category: true } },
          },
        },
      },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });

    return userFavs.map((fav) => ({
      id: fav.id,
      newspaperId: fav.newspaperId,
      createdAt: fav.createdAt,
      newspaper: {
        ...fav.newspaper,
        categories: fav.newspaper.categories?.map((c) => c.category) ?? [],
      },
    }));
  }

  async checkNewspaperFavorite(userId: string, newspaperId: string) {
    const fav = await this.db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, userId),
        eq(favorites.newspaperId, newspaperId),
      ),
    });
    return { isFavorite: !!fav };
  }

  async addNewspaperFavorite(userId: string, newspaperId: string) {
    const newspaper = await this.db.query.newspapers.findFirst({
      where: eq(newspapers.id, newspaperId),
    });
    if (!newspaper) throw new NotFoundException("Journal non trouvé");

    const existing = await this.db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, userId),
        eq(favorites.newspaperId, newspaperId),
      ),
    });
    if (existing) return { isFavorite: true };

    await this.db.insert(favorites).values({ userId, newspaperId });
    return { isFavorite: true };
  }

  async removeNewspaperFavorite(userId: string, newspaperId: string) {
    await this.db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.newspaperId, newspaperId),
        ),
      );
    return { isFavorite: false };
  }

  async toggleNewspaperFavorite(userId: string, newspaperId: string) {
    const newspaper = await this.db.query.newspapers.findFirst({
      where: eq(newspapers.id, newspaperId),
    });
    if (!newspaper) throw new NotFoundException("Journal non trouvé");

    const existing = await this.db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, userId),
        eq(favorites.newspaperId, newspaperId),
      ),
    });

    if (existing) {
      await this.removeNewspaperFavorite(userId, newspaperId);
      return { isFavorite: false, message: "Retiré des favoris" };
    } else {
      await this.addNewspaperFavorite(userId, newspaperId);
      return { isFavorite: true, message: "Ajouté aux favoris" };
    }
  }
}
