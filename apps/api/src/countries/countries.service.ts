import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { countries } from "../db/app-schema";
import { eq } from "drizzle-orm";
import type { Database } from "../db";
import type { CreateCountryDto, UpdateCountryDto } from "./dto/country.dto";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class CountriesService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async findAll() {
    return this.db.select().from(countries);
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(countries)
      .where(eq(countries.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException("Pays non trouvé");
    }
    return result[0];
  }

  async findBySlug(slug: string) {
    const result = await this.db
      .select()
      .from(countries)
      .where(eq(countries.slug, slug))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException("Pays non trouvé");
    }
    return result[0];
  }

  async findByCode(code: string) {
    const result = await this.db
      .select()
      .from(countries)
      .where(eq(countries.code, code.toUpperCase()))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException("Pays non trouvé");
    }
    return result[0];
  }

  async create(dto: CreateCountryDto) {
    try {
      const slug = generateSlug(dto.name);
      const result = await this.db.insert(countries).values({
        name: dto.name,
        slug,
        flag: dto.flag,
        currency: dto.currency,
        code: dto.code.toUpperCase(),
        host: dto.host ?? null,
      });

      const insertId = result[0].insertId;
      return this.findById(insertId);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Erreur lors de la création du pays",
      );
    }
  }

  async update(id: number, dto: UpdateCountryDto) {
    await this.findById(id); // vérifie l'existence

    const data: Record<string, unknown> = {};
    if (dto.name) {
      data.name = dto.name;
      data.slug = generateSlug(dto.name);
    }
    if (dto.flag) data.flag = dto.flag;
    if (dto.currency) data.currency = dto.currency;
    if (dto.code) data.code = dto.code.toUpperCase();
    if (dto.host !== undefined) data.host = dto.host;

    await this.db.update(countries).set(data).where(eq(countries.id, id));
    return this.findById(id);
  }

  async remove(id: number) {
    await this.findById(id); // vérifie l'existence
    await this.db.delete(countries).where(eq(countries.id, id));
  }
}
