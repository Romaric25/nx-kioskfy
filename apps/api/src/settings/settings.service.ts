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
  // ── Général ────────────────────────────────────────────────────────
  { key: "site_name", value: "Kioskfy", label: "Nom du site", group: "general", type: "string", isPublic: true, description: "Nom affiché dans l'en-tête, les emails et les métadonnées du site." },
  { key: "site_identifier", value: "", label: "Identifiant du site", group: "general", type: "string", isPublic: false, description: "Identifiant unique du site (facturation, suivi ou intégrations externes). Format conseillé : KFY-<PAYS>-<NUMÉRO> — ex. KFY-TG-001." },
  { key: "site_description", value: "Votre kiosque numérique", label: "Description du site", group: "general", type: "string", isPublic: true, description: "Courte description utilisée sur la page d'accueil et les partages." },
  { key: "site_logo_url", value: "", label: "URL du logo", group: "general", type: "string", isPublic: true, description: "URL publique du logo du site (https://...)." },
  { key: "contact_email", value: "contact@kioskfy.com", label: "Email de contact", group: "general", type: "string", isPublic: true, description: "Adresse email utilisée pour le support et les notifications." },
  { key: "support_phone", value: "", label: "Téléphone du support", group: "general", type: "string", isPublic: true, description: "Numéro affiché dans le pied de page et la page contact." },
  { key: "footer_text", value: "© Kioskfy — Tous droits réservés", label: "Texte du pied de page", group: "general", type: "string", isPublic: true, description: "Texte affiché dans le pied de page du site public." },
  // ── SEO & Métadonnées ────────────────────────────────────────────────
  { key: "site_keywords", value: "kiosque, journaux, presse, numérique", label: "Mots-clés (SEO)", group: "seo", type: "string", isPublic: true, description: "Mots-clés séparés par des virgules pour les balises meta." },
  // ── Réseaux sociaux ─────────────────────────────────────────────────
  { key: "facebook_url", value: "", label: "Facebook URL", group: "social", type: "string", isPublic: true },
  { key: "twitter_url", value: "", label: "Twitter URL", group: "social", type: "string", isPublic: true },
  { key: "instagram_url", value: "", label: "Instagram URL", group: "social", type: "string", isPublic: true },
  { key: "youtube_url", value: "", label: "YouTube URL", group: "social", type: "string", isPublic: true },
  { key: "linkedin_url", value: "", label: "LinkedIn URL", group: "social", type: "string", isPublic: true },
  // ── Maintenance ──────────────────────────────────────────────────────
  { key: "maintenance_mode", value: "false", label: "Mode maintenance", group: "maintenance", type: "boolean", isPublic: true, description: "Bloque l'accès public au site et affiche le message de maintenance." },
  { key: "maintenance_message", value: "Le site est en maintenance. Merci de réessayer plus tard.", label: "Message de maintenance", group: "maintenance", type: "string", isPublic: true },
  // ── Paiements & commissions ──────────────────────────────────────────
  { key: "commission_rate", value: "25", label: "Commission plateforme (%)", group: "payments", type: "number", isPublic: false, description: "Part prélevée par la plateforme sur chaque vente (répartition des revenus)." },
  { key: "organization_percentage", value: "75", label: "Part organisation (%)", group: "payments", type: "number", isPublic: false, description: "Part reversée à l'agence de presse sur chaque vente." },
  { key: "min_withdrawal_amount", value: "1000", label: "Retrait minimum (XAF)", group: "payments", type: "number", isPublic: false, description: "Montant minimum qu'une agence peut retirer." },
  { key: "currency", value: "XAF", label: "Devise", group: "payments", type: "string", isPublic: true, description: "Code de la devise utilisée sur la plateforme." },
  { key: "marketplace_pispi_alias", value: "", label: "Alias PI-SPI de la marketplace", group: "payments", type: "string", isPublic: true, description: "Alias du compte PI-SPI (BCEAO) de la marketplace qui reçoit les paiements des clients — utilisé comme bénéficiaire (payeAlias) des demandes de paiement du checkout. Laissez vide pour laisser l'API SaaS résoudre l'alias depuis le numéro de compte configuré." },
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
      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
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
