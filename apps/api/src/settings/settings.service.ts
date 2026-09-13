import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { siteSettings } from "../db/app-schema";
import { eq } from "drizzle-orm";
import type { Database } from "../db";

function parseValue(value: string | null, type: string) {
  if (value === null) return null;
  if (type === "boolean") return value === "true";
  if (type === "number") return Number(value);
  if (type === "json") {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

function formatKeyToLabel(key: string) {
  return key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const DEFAULT_SETTINGS = [
  { key: "site_name", value: "Kioskfy", label: "Nom du site", group: "general", type: "string", isPublic: true },
  { key: "site_description", value: "Votre kiosque numérique", label: "Description", group: "seo", type: "string", isPublic: true },
  { key: "contact_email", value: "contact@kioskfy.com", label: "Email de contact", group: "general", type: "string", isPublic: true },
  { key: "maintenance_mode", value: "false", label: "Mode maintenance", group: "maintenance", type: "boolean", isPublic: true },
  { key: "facebook_url", value: "", label: "Facebook URL", group: "social", type: "string", isPublic: true },
  { key: "twitter_url", value: "", label: "Twitter URL", group: "social", type: "string", isPublic: true },
  { key: "instagram_url", value: "", label: "Instagram URL", group: "social", type: "string", isPublic: true },
];

@Injectable()
export class SettingsService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async getAll() {
    const settings = await this.db.select().from(siteSettings);
    return settings.reduce((acc, s) => {
      acc[s.key] = { ...s, value: parseValue(s.value, s.type) };
      return acc;
    }, {} as Record<string, any>);
  }

  async update(updates: Record<string, any>) {
    await Promise.all(Object.entries(updates).map(async ([key, value]) => {
      let stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      const existing = await this.db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });

      if (existing) {
        await this.db.update(siteSettings).set({ value: stringValue }).where(eq(siteSettings.key, key));
      } else {
        await this.db.insert(siteSettings).values({
          key, value: stringValue,
          type: typeof value === "boolean" ? "boolean" : typeof value === "object" ? "json" : "string",
          label: formatKeyToLabel(key),
          group: "general",
        });
      }
    }));
  }

  async seed() {
    let created = 0;
    for (const s of DEFAULT_SETTINGS) {
      const existing = await this.db.query.siteSettings.findFirst({ where: eq(siteSettings.key, s.key) });
      if (!existing) {
        await this.db.insert(siteSettings).values(s);
        created++;
      }
    }
    return created;
  }
}
