import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { DRIZZLE } from "../db";
import { categories } from "../db/app-schema";
import { eq, desc } from "drizzle-orm";
import type { Database } from "../db";
import type { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async findAll() {
    return this.db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .orderBy(desc(categories.createdAt));
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (result.length === 0) throw new NotFoundException("Catégorie non trouvée");
    return result[0];
  }

  async findBySlug(slug: string) {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (result.length === 0) throw new NotFoundException("Catégorie non trouvée");
    return result[0];
  }

  async create(dto: CreateCategoryDto) {
    try {
      const exists = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, dto.slug))
        .limit(1);

      if (exists.length > 0) {
        throw new ConflictException("Une catégorie avec ce slug existe déjà");
      }

      const result = await this.db.insert(categories).values({
        name: dto.name,
        slug: dto.slug,
        icon: dto.icon,
        color: dto.color,
      });

      return { id: result[0].insertId };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    }
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const existing = await this.findById(id);

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, dto.slug))
        .limit(1);

      if (slugExists.length > 0) {
        throw new ConflictException("Une catégorie avec ce slug existe déjà");
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.slug) data.slug = dto.slug;
    if (dto.icon) data.icon = dto.icon;
    if (dto.color !== undefined) data.color = dto.color;

    if (Object.keys(data).length > 0) {
      await this.db.update(categories).set(data).where(eq(categories.id, id));
    }
  }

  async remove(id: number) {
    await this.findById(id);
    await this.db.delete(categories).where(eq(categories.id, id));
  }
}
